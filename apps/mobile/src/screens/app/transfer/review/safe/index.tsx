import { useResetToRoutes } from '@nestwallet/app/common/hooks/navigation';
import { AssetTransfer } from '@nestwallet/app/common/types';
import {
  IOrganization,
  ITransactionProposal,
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { SafeTransferReviewWithQuery } from '@nestwallet/app/screens/transfer/review/safe/query';
import { useNavigation } from '@react-navigation/native';
import { useUserContext } from '../../../../../provider/user';

export function SafeTransferReviewWithData(props: {
  wallet: IWallet;
  organization: IOrganization;
  transfers: AssetTransfer[];
}) {
  const { wallet, organization, transfers } = props;
  const { signers } = useUserContext();
  const navigation = useNavigation();
  const resetToRoutes = useResetToRoutes();

  const navigateToProposal = (id: string) => {
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: wallet.id,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'transactionProposal',
          params: {
            proposalId: id,
            walletId: wallet.id,
          },
        },
      },
    ]);
  };

  const handleProposalCreated = async (proposal: ITransactionProposal) => {
    if (transfers.length === 0) return;
    if (wallet.type === IWalletType.Safe) {
      navigateToProposal(proposal.id);
    } else {
      navigateToProposal(proposal.id);
    }
  };

  const handleDeleteTransfer = (transfer: AssetTransfer) => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferReview',
        params: {
          walletId: wallet.id,
          transfers: transfers.filter((item) => item !== transfer),
        },
      },
    });
  };

  const handleAddTransfer = () => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferAsset',
        params: {
          walletId: wallet.id,
          transfers,
        },
      },
    });
  };

  return (
    <SafeTransferReviewWithQuery
      transfers={transfers}
      wallet={wallet}
      organization={organization}
      signers={signers}
      onProposalCreated={handleProposalCreated}
      onAddTransfer={handleAddTransfer}
      onDeleteTransfer={handleDeleteTransfer}
    />
  );
}
