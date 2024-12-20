import { getHttpEndpoint } from '@orbs-network/ton-access';
import { useQuery } from '@tanstack/react-query';
import {
  beginCell,
  Builder,
  Cell,
  internal,
  MessageRelaxed,
  storeMessageRelaxed,
  TonClient,
} from '@ton/ton';
import { ethers } from 'ethers';
import { useMutationEmitter } from '../../../common/hooks/query';
import { Origin } from '../../../common/types';
import { retry } from '../../../common/utils/functions';
import {
  ICreateTransactionProposalInput,
  ITransactionMetadataInput,
  ITransactionProposal,
  ITransactionProposalType,
  IUpsertInteractedAddressInput,
  IWallet,
  useCreateTransactionProposalMutation,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { ChainId } from '../../chain';
import { createEphemeralTransactionProposal } from '../../proposal/utils';
import { IProtectedWalletClient } from '../../wallet/service/interface';
import { AbstractTvmSigner } from '../signer/types';
import { TonMessage, WalletVersion } from '../types';
import {
  getExternalBoc,
  getTonWalletFromVersion,
  getTonWalletId,
  messageParams,
  sendBocWithResponse,
} from '../utils';

export function useCreateAndExecuteTvmTransaction(
  client: IProtectedWalletClient,
  wallet: IWallet,
) {
  const createTransactionProposalMutation = useMutationEmitter(
    [graphqlType.PendingTransaction],
    useCreateTransactionProposalMutation(),
  );

  const executeTransaction = async (props: {
    messages: TonMessage[];
    origin?: Origin;
    interactedAddresses?: IUpsertInteractedAddressInput[];
    metadata: ITransactionMetadataInput[];
  }): Promise<ITransactionProposal> => {
    const { messages, origin, interactedAddresses, metadata } = props;
    const signer = await client.getTvmSigner(ChainId.Ton, wallet);
    const endpoint = await getHttpEndpoint();
    const { sendMode, seqno, boc } = await getPreparedBocAndData(
      wallet,
      signer,
      endpoint,
      messages,
      true,
    );
    const txHash = await sendBocWithResponse(endpoint, boc);
    const input: ICreateTransactionProposalInput = {
      type: ITransactionProposalType.TvmKey,
      tvmKey: {
        walletId: wallet.id,
        chainId: ChainId.Ton,
        data: boc,
        toAddress: wallet.address,
        originName: origin?.title,
        originImageURL: origin?.favIconUrl,
        originURL: origin?.url,
        sendMode,
        seqno,
        txHash,
      },
      metadata,
      interactedAddresses,
    };
    const createTx = () =>
      createTransactionProposalMutation.mutateAsync({
        input,
      });
    const result = await retry(createTx).catch(() =>
      createEphemeralTransactionProposal(wallet, input),
    );
    return result.createTransactionProposal as ITransactionProposal;
  };

  return {
    executeTransaction,
  };
}

export function serializeTransactionV3(args: {
  seqno: number;
  sendMode: number;
  walletId: number;
  messages: TonMessage[];
  timeout?: number;
}) {
  // Check number of messages
  if (args.messages.length > 4) {
    throw Error('Maximum number of messages in a single transfer is 4');
  }
  const signingMessage = beginCell().storeUint(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    // Default timeout: 60 seconds
    signingMessage.storeUint(
      Math.floor(Date.now() / 1e3) + (args.timeout ?? 90),
      32,
    );
  }
  signingMessage.storeUint(args.seqno, 32);
  for (const m of args.messages) {
    signingMessage.storeUint(args.sendMode, 8);
    signingMessage.storeRef(
      beginCell().store(
        storeMessageRelaxed(
          internal({
            to: m.address,
            value: m.amount,
            body: m.body ? Cell.fromBase64(m.body) : undefined,
            bounce: m.bounce,
          }),
        ),
      ),
    );
  }
  return signingMessage;
}

export function serializeTransactionV4(args: {
  seqno: number;
  sendMode: number;
  walletId: number;
  messages: TonMessage[];
  timeout?: number;
}) {
  // Check number of messages
  if (args.messages.length > 4) {
    throw Error('Maximum number of messages in a single transfer is 4');
  }
  const signingMessage = beginCell().storeUint(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    // Default timeout: 60 seconds
    signingMessage.storeUint(
      Math.floor(Date.now() / 1e3) + (args.timeout ?? 90),
      32,
    );
  }
  signingMessage.storeUint(args.seqno, 32);
  signingMessage.storeUint(0, 8); // Simple order
  for (const m of args.messages) {
    signingMessage.storeUint(args.sendMode, 8);
    signingMessage.storeRef(
      beginCell().store(
        storeMessageRelaxed(
          internal({
            to: m.address,
            value: m.amount,
            body: m.body ? Cell.fromBase64(m.body) : undefined,
            bounce: m.bounce,
          }),
        ),
      ),
    );
  }
  return signingMessage;
}

export function serializeTransactionV5(args: {
  seqno: number;
  sendMode: number;
  walletId: number;
  messages: TonMessage[];
  timeout?: number;
}) {
  // TODO: handle extended actions
  // Check number of messages
  if (args.messages.length > 255) {
    throw Error('Maximum number of messages in a single transfer is 255');
  }
  const signingMessage = beginCell()
    .storeUint(0x7369676e, 32)
    .storeInt(args.walletId, 32);
  if (args.seqno === 0) {
    for (let i = 0; i < 32; i++) {
      signingMessage.storeBit(1);
    }
  } else {
    // Default timeout: 60 seconds
    signingMessage.storeUint(
      Math.floor(Date.now() / 1e3) + (args.timeout ?? 90),
      32,
    );
  }
  signingMessage.storeUint(args.seqno, 32);

  const storeMessage = (message: MessageRelaxed) => (builder: Builder) => {
    builder
      .storeUint(0x0ec3c86d, 32)
      .storeUint(args.sendMode, 8)
      .storeRef(beginCell().store(storeMessageRelaxed(message)).endCell());
  };

  const actions = args.messages.slice().reverse();
  const cell = actions.reduce(
    (cell, m) =>
      beginCell()
        .storeRef(cell)
        .store(
          storeMessage(
            internal({
              to: m.address,
              value: m.amount,
              body: m.body ? Cell.fromBase64(m.body) : undefined,
              bounce: m.bounce,
            }),
          ),
        )
        .endCell(),
    beginCell().endCell(),
  );
  signingMessage.storeMaybeRef(cell).storeUint(0, 1);
  return signingMessage;
}

export function serializeTransaction(args: {
  version: WalletVersion;
  seqno: number;
  sendMode: number;
  walletId: number;
  messages: TonMessage[];
  timeout?: number;
}) {
  if (args.version === 'V3R1' || args.version === 'V3R2') {
    return serializeTransactionV3(args);
  } else if (args.version === 'W5') {
    return serializeTransactionV5(args);
  } else {
    return serializeTransactionV4(args);
  }
}

export async function getPreparedBocAndData(
  wallet: IWallet,
  signer: AbstractTvmSigner,
  endpoint: string,
  messages: TonMessage[],
  sign: boolean,
) {
  const tonClient = new TonClient({
    endpoint,
  });
  const publicKey = await signer.getPublicKey();
  const version: WalletVersion = (wallet.version as WalletVersion) ?? 'V4';
  const tonWallet = getTonWalletFromVersion(version, publicKey);
  const { sendMode, seqno, stateInit } = await messageParams(
    tonClient,
    tonWallet,
  );
  const walletId = getTonWalletId(tonWallet);
  const signingMessage = serializeTransaction({
    version,
    seqno,
    sendMode,
    walletId,
    messages,
    timeout: sign ? undefined : 300,
  });
  const cellHash = signingMessage.endCell().hash();
  const signature = sign
    ? await signer.signTransaction(cellHash.toString('hex'))
    : '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
  const internalBoc =
    version === 'W5'
      ? beginCell()
          .storeBuilder(signingMessage)
          .storeBuffer(Buffer.from(ethers.getBytes(`0x${signature}`)))
          .endCell()
      : beginCell()
          .storeBuffer(Buffer.from(ethers.getBytes(`0x${signature}`)))
          .storeBuilder(signingMessage)
          .endCell();
  return {
    seqno,
    sendMode,
    boc: getExternalBoc(wallet.address, internalBoc, stateInit),
  };
}

export function usePreparedBocQuery(
  client: IProtectedWalletClient,
  wallet: IWallet,
  messages: TonMessage[],
) {
  return useQuery({
    queryKey: [
      'queryPreparedBoc',
      messages.map((message) => ({
        ...message,
        amount: message.amount.toString(),
      })),
    ],
    queryFn: async () => {
      const signer = await client.getTvmSigner(ChainId.Ton, wallet);
      const endpoint = await getHttpEndpoint();
      const { boc } = await getPreparedBocAndData(
        wallet,
        signer,
        endpoint,
        messages,
        false,
      );
      return boc;
    },
  });
}
