import { IDappData } from '@nestwallet/app/common/types';
import { id } from '@nestwallet/app/common/utils/functions';
import {
  IBlockchainType,
  ISafeTransactionProposal,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useSafeTransactionProposalContext } from '@nestwallet/app/provider/safe-transaction-proposal';
import { SafeTransactionProposal } from '@nestwallet/app/screens/proposal/safe/transaction';
import { useNavigation } from '@react-navigation/native';
import { useGoBackOrClose } from '../../../../../hooks/navigation';
import { useInternalTransactionApprovalModalStackNavigationOptions } from '../../../../../navigation/navigators/options';
import { useLockContext } from '../../../../../provider/lock';
import { useUserContext } from '../../../../../provider/user';
import { openTrezorRequestString } from '../../utils';

interface ISafeTransactionProposalWithDataProps {
  dappData?: IDappData;
}

export function SafeTransactionProposalWithData(
  props: ISafeTransactionProposalWithDataProps,
) {
  const { dappData } = props;
  const { windowType } = useNestWallet();
  const { wallets, signers } = useUserContext();
  const { client } = useLockContext();
  const { executors, proposal } = useSafeTransactionProposalContext();
  const navigation = useNavigation();
  const navigateBack = useGoBackOrClose(!dappData || !!dappData.isInternal);

  useInternalTransactionApprovalModalStackNavigationOptions(
    dappData,
    'Transaction signature request rejected',
  );

  const handleDeleted = async () => {
    if (dappData) {
      await client
        .resolveApproval({
          ...dappData,
          blockchain: IBlockchainType.Evm,
          error: 'Transaction Rejected',
          result: undefined,
        })
        .catch(id);
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
    await client.resolveApproval({
      requestId: dappData.requestId,
      blockchain: IBlockchainType.Evm,
      tabId: dappData.tabId,
      result: data,
    });
  };

  return (
    <SafeTransactionProposal
      dappData={dappData}
      proposal={proposal}
      executors={executors}
      signers={signers}
      wallets={wallets}
      windowType={windowType}
      walletService={client}
      onApprove={handleApprove}
      onClose={navigateBack}
      onDeleted={handleDeleted}
      onProposalRejected={handleProposalRejected}
      onTrezorRequest={openTrezorRequestString}
    />
  );
}
