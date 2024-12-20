import {
  IApproveMessageInput,
  ISignerWallet,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { ChainId } from '@nestwallet/app/features/chain';
import {
  IMessageProposal,
  IMessageProposalType,
  useCreateMessageProposalMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { decode } from 'bs58';
import { useState } from 'react';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import { graphqlType } from '../../../../graphql/types';
import { SigningSheet } from '../../../proposal/signing-sheet';
import { ConnectionType } from '../../types';
import { ApprovalMessageView } from '../view';

interface ApprovalSvmMessageWithQueryProps {
  chainId: ChainId;
  messageParams: IApproveMessageInput;
  wallet: ISignerWallet;
  client: IProtectedWalletClient;
  connectionType: ConnectionType;
  onCancel: VoidPromiseFunction;
  onCompleted: VoidFunction;
  onMessageProposalCreated: (proposal: IMessageProposal) => Promise<void>;
}

export function ApprovalSvmMessageWithQuery(
  props: ApprovalSvmMessageWithQueryProps,
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
  const decodedMessage = Buffer.from(decode(message)).toString('utf-8');
  const createMessageProposalMutation = useMutationEmitter(
    graphqlType.PendingMessage,
    useCreateMessageProposalMutation(),
  );

  const handleSign = async () => {
    const signer = await client.getSvmSigner(ChainId.Solana, wallet);
    const signature = await signer.signMessage(message);
    const result = await createMessageProposalMutation.mutateAsync({
      input: {
        type: IMessageProposalType.SvmKey,
        svmKey: {
          message: decodedMessage,
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
        message={decodedMessage}
        type={type}
        missingKeyring={!wallet.hasKeyring}
        connectionType={connectionType}
        onCancel={onCancel}
        onSubmit={async () => setShowSigningSheet(true)}
      />
      <SigningSheet
        wallet={wallet}
        type='message'
        isShowing={showSigningSheet}
        onClose={() => setShowSigningSheet(false)}
        onCompleted={onCompleted}
        onSign={handleSign}
      />
    </>
  );
}
