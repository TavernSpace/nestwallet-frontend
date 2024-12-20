import { id } from '@nestwallet/app/common/utils/functions';
import {
  IBlockchainType,
  ISafeTransactionProposal,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { WindowType } from '@nestwallet/app/provider/nestwallet';
import { useSafeTransactionProposalContext } from '@nestwallet/app/provider/safe-transaction-proposal';
import { SafeTransactionProposal } from '@nestwallet/app/screens/proposal/safe/transaction';
import { useNavigation } from '@react-navigation/native';
import { DappData } from '../../../../../navigation/types';
import { useAppContext } from '../../../../../provider/application';
import { useUserContext } from '../../../../../provider/user';

interface ISafeTransactionProposalWithDataProps {
  dappData?: DappData;
}

export function SafeTransactionProposalWithData(
  props: ISafeTransactionProposalWithDataProps,
) {
  const { dappData } = props;
  const { wallets, signers } = useUserContext();
  const { walletService, walletConnectProvider } = useAppContext();
  const { executors, proposal } = useSafeTransactionProposalContext();
  const navigation = useNavigation();

  const handleDeleted = async () => {
    if (dappData) {
      if (dappData.walletConnect) {
        await walletConnectProvider.rejectRequest(dappData.walletConnect);
      } else {
        await walletService
          .resolveApproval({
            ...dappData,
            blockchain: IBlockchainType.Evm,
            error: 'Transaction Rejected',
            result: undefined,
          })
          .catch(id);
      }
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('app', {
        screen: 'walletDetails',
      });
    }
  };

  const handleProposalRejected = (rejectProposal: ISafeTransactionProposal) => {
    navigation.navigate('app', {
      screen: 'transactionProposal',
      params: {
        proposalId: rejectProposal.id,
        walletId: proposal.wallet.id,
      },
    });
  };

  const handleApprove = async (data: unknown) => {
    if (!dappData) return;
    if (dappData.walletConnect) {
      await walletConnectProvider.confirmRequest(dappData.walletConnect, data);
    } else {
      await walletService.resolveApproval({
        requestId: dappData.requestId,
        blockchain: IBlockchainType.Evm,
        tabId: dappData.tabId,
        result: data,
      });
    }
  };

  return (
    <SafeTransactionProposal
      dappData={dappData}
      proposal={proposal}
      executors={executors}
      signers={signers}
      wallets={wallets}
      windowType={WindowType.none}
      walletService={walletService}
      onApprove={handleApprove}
      onClose={navigation.goBack}
      onDeleted={handleDeleted}
      onProposalRejected={handleProposalRejected}
    />
  );
}
