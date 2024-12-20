import {
  IApproveMessageInput,
  ISignerWallet,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import {
  ChainId,
  isBlowfishSupportedChain,
} from '@nestwallet/app/features/chain';
import { TypedData } from '@nestwallet/app/features/keyring/types';
import {
  ICreateMessageProposalInput,
  IMessageEvents,
  IMessageProposal,
  IMessageProposalType,
  IMessageType,
  IWalletType,
  useCreateMessageProposalMutation,
  useMessageSimulationQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { isHexString } from 'ethers';
import { useState } from 'react';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { graphqlType } from '../../../../graphql/types';
import { SigningSheet } from '../../../proposal/signing-sheet';
import { ConnectionType } from '../../types';
import { ApprovalMessageView } from '../view';

interface ApprovalEvmMessageWithQueryProps {
  chainId: ChainId;
  messageParams: IApproveMessageInput;
  wallet: ISignerWallet;
  client: IProtectedWalletClient;
  connectionType: ConnectionType;
  onCancel: VoidPromiseFunction;
  onCompleted: VoidFunction;
  onMessageProposalCreated: (proposal: IMessageProposal) => Promise<void>;
}

export function ApprovalEvmMessageWithQuery(
  props: ApprovalEvmMessageWithQueryProps,
) {
  const {
    messageParams,
    wallet,
    chainId,
    client,
    connectionType,
    onCancel,
    onCompleted,
    onMessageProposalCreated,
  } = props;
  const { origin, message, type } = messageParams;

  const [showSigningSheet, setShowSigningSheet] = useState(false);
  const createMessageProposalMutation = useMutationEmitter(
    graphqlType.PendingMessage,
    useCreateMessageProposalMutation(),
  );

  const isSafe = wallet.type === IWalletType.Safe;
  const isMessageHex = isHexString(message);
  const chainWithDefault = isBlowfishSupportedChain(wallet.chainId || chainId)
    ? wallet.chainId || chainId
    : 1;
  const shouldSimulate =
    messageParams.type === IMessageType.Eip712 || isMessageHex;

  // TODO: what do we do if we are on a malicious DApp which switches chain to a different chain than the message signature affects?
  // TODO: to help preserve rate limit don't simulate all personal_sign, only typed_data and hex strings, personal_sign is usually just login
  // and typed_data is usually used to move and approve funds
  const simulatedEventsQuery = useMessageSimulationQuery(
    {
      input: {
        walletId: wallet.id,
        chainId: chainWithDefault,
        data: message,
        origin: origin.url!,
        type: type,
      },
    },
    { enabled: shouldSimulate },
  );
  const simulatedEvents = loadDataFromQuery(
    simulatedEventsQuery,
    (data) => data.messageSimulation as IMessageEvents,
  );

  const handleSubmitMessage = async (input: ICreateMessageProposalInput) => {
    if (wallet.type !== IWalletType.Safe) {
      setShowSigningSheet(true);
    } else {
      const newMessage = await createMessageProposalMutation.mutateAsync({
        input,
      });
      await onMessageProposalCreated(
        newMessage.createMessageProposal as IMessageProposal,
      );
    }
  };

  const handleSign = async () => {
    const signer = await client.getEvmSigner(1, wallet);
    let signature: string;
    if (type === IMessageType.Eip191) {
      signature = await signer.signMessage(message);
    } else {
      const typedData = JSON.parse(message) as TypedData;
      signature = await signer.signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
        typedData.primaryType,
      );
    }
    const result = await createMessageProposalMutation.mutateAsync({
      input: {
        type: IMessageProposalType.EthKey,
        ethKey: {
          message,
          originName: origin?.title,
          originImageURL: origin?.favIconUrl,
          originURL: origin?.url,
          type,
          signature,
          walletId: wallet.id,
        },
      },
    });
    await onMessageProposalCreated(
      result.createMessageProposal as IMessageProposal,
    );
  };

  return (
    <>
      <ApprovalMessageView
        origin={origin}
        wallet={wallet}
        chainId={chainId}
        message={message}
        type={type}
        connectionType={connectionType}
        simulatedEvents={shouldSimulate ? simulatedEvents : undefined}
        missingKeyring={!isSafe && !wallet.hasKeyring}
        onCancel={onCancel}
        onSubmit={handleSubmitMessage}
      />
      {!isSafe && (
        <SigningSheet
          wallet={wallet}
          type='message'
          isShowing={showSigningSheet}
          onClose={() => setShowSigningSheet(false)}
          onCompleted={onCompleted}
          onSign={handleSign}
        />
      )}
    </>
  );
}
