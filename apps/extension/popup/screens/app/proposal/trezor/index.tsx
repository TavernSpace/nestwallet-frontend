import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { ISignerWallet } from '@nestwallet/app/common/types';
import { discard, retry } from '@nestwallet/app/common/utils/functions';
import { useExecuteEthKeyTransactionProposal } from '@nestwallet/app/features/evm/transaction/execute';
import {
  TrezorAction,
  TrezorExecuteETHKeyTransactionRequest,
  TrezorExecuteSafeTransactionRequest,
  TrezorSignSafeMessageRequest,
  TrezorSignSafeTransactionRequest,
} from '@nestwallet/app/features/keyring/trezor/types';
import {
  useConfirmSafeTransactionProposal,
  useExecuteSafeTransactionProposal,
} from '@nestwallet/app/features/safe/sign';
import {
  createSafeWithProvider,
  getSafeMessageTypedData,
} from '@nestwallet/app/features/safe/utils';
import {
  IMessageProposalType,
  ISafeMessageProposal,
  useConfirmMessageProposalMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { TrezorRequestScreen } from '@nestwallet/app/screens/proposal/trezor/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useSignerById } from '../../../../hooks/signer';
import { AppStackParamList } from '../../../../navigation/types';
import { parsePayload } from '../../../../navigation/utils';
import { useLockContext } from '../../../../provider/lock';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'trezorRequest'>;
type RouteParams = RouteProps['route']['params'];

export const TrezorRequestWithData = withUserContext(_TrezorRequestWithData);

function _TrezorRequestWithData({ route }: RouteProps) {
  const {
    walletId,
    request: { type, ...data },
  } = parsePayload<RouteParams>(route.params);
  const { client } = useLockContext();
  const { signer } = useSignerById(walletId);
  useResetToOnInvalid('app', !signer);

  const executeEthKeyTransactionProposalMutation =
    useExecuteEthKeyTransactionProposal();
  const confirmSafeTransactionProposalMutation =
    useConfirmSafeTransactionProposal();
  const executeSafeTransactionProposalMutation =
    useExecuteSafeTransactionProposal();
  const confirmMessageProposalMutation = useConfirmMessageProposalMutation();

  const handleTrezorAction = async (wallet: ISignerWallet) => {
    if (type === TrezorAction.EthKeyTxExecute) {
      const request = data as TrezorExecuteETHKeyTransactionRequest;
      const proposal = request.proposal;
      const options = request.transactionOptions;
      const chainId = request.proposal.chainId || 1;
      const signer = await client.getEvmSigner(chainId, wallet, true);
      const nonce = await signer.getNonce(
        request.replacement ? 'latest' : 'pending',
      );
      const txResponse = await signer.sendTransaction({
        ...options,
        data: proposal.data ?? '0x',
        from: wallet.address,
        to: proposal.toAddress,
        value: proposal.value,
        type: options.gasPrice ? 0 : 2,
        chainId: proposal.chainId,
        nonce,
      });
      await retry(() =>
        executeEthKeyTransactionProposalMutation.mutateAsync(
          proposal,
          txResponse,
        ),
      ).catch(discard);
    } else if (type === TrezorAction.SafeTxExecute) {
      const request = data as TrezorExecuteSafeTransactionRequest;
      const signer = await client.getEvmSigner(
        request.proposal.chainId,
        wallet,
        true,
      );
      const safe = await createSafeWithProvider(
        request.proposal.wallet,
        signer,
      );
      await executeSafeTransactionProposalMutation.mutateAsync(
        safe,
        request.proposal,
        request.transactionOptions,
      );
    } else if (type === TrezorAction.SafeTxSign) {
      const request = data as TrezorSignSafeTransactionRequest;
      const signer = await client.getEvmSigner(
        request.proposal.chainId,
        wallet,
      );
      const safe = await createSafeWithProvider(
        request.proposal.wallet,
        signer,
      );
      await confirmSafeTransactionProposalMutation.mutateAsync(
        safe,
        request.proposal,
      );
    } else if (type === TrezorAction.SafeMessageSign) {
      const request = data as TrezorSignSafeMessageRequest;
      const message: ISafeMessageProposal = request.proposal;
      const safeTypedData = getSafeMessageTypedData(
        message.wallet.chainId,
        message.wallet.address,
        message.messageHash,
      );
      const signer = await client.getEvmSigner(message.wallet.chainId, wallet);
      const signature = await signer.signTypedData(
        safeTypedData.domain,
        safeTypedData.types,
        safeTypedData.message,
        safeTypedData.primaryType,
      );
      await confirmMessageProposalMutation.mutateAsync({
        input: {
          id: message.id,
          type: IMessageProposalType.Safe,
          safe: { signature },
        },
      });
    }
  };

  const handleCancel = () => {
    window.close();
  };

  return signer ? (
    <TrezorRequestScreen
      wallet={signer}
      type={type === TrezorAction.SafeMessageSign ? 'message' : 'transaction'}
      onCancel={handleCancel}
      onRequest={() => handleTrezorAction(signer)}
    />
  ) : null;
}
