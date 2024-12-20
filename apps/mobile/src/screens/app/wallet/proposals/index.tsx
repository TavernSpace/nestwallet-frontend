import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  tagSafeMessageProposal,
  tagSafeTransactionProposal,
} from '@nestwallet/app/features/proposal/utils';
import {
  IMessageProposal,
  ITransactionProposal,
  IWallet,
  useSyncWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { SafeProposalsScreenWithQuery } from '@nestwallet/app/screens/wallet-details/transactions/proposals/safe/query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWalletById } from '../../../../hooks/wallet';
import { AppStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'walletProposals'>;

export const WalletProposalsWithData = withUserContext(
  _WalletProposalsWithData,
);

function _WalletProposalsWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const navigation = useNavigation();

  const syncWalletMutation = useMutationEmitter(
    [graphqlType.Wallet, graphqlType.Proposal, graphqlType.Message],
    useSyncWalletMutation(),
  );

  const handleSync = async () => {
    await syncWalletMutation.mutateAsync({
      input: {
        walletId,
        syncMessages: true,
        syncProposals: true,
        syncHistory: false,
      },
    });
  };

  const handlePressMessageProposal = (
    message: IMessageProposal,
    wallet: IWallet,
  ) => {
    navigation.navigate('app', {
      screen: 'messageProposal',
      params: {
        messageId: message.id,
        walletId: wallet.id,
      },
    });
  };

  const handlePressTransactionProposal = (
    proposal: ITransactionProposal,
    wallet: IWallet,
  ) => {
    navigation.navigate('app', {
      screen: 'transactionProposal',
      params: {
        proposalId: proposal.id,
        walletId: wallet.id,
      },
    });
  };

  return wallet ? (
    <SafeProposalsScreenWithQuery
      wallet={wallet}
      onPressMessageProposal={(proposal) =>
        handlePressMessageProposal(tagSafeMessageProposal(proposal), wallet)
      }
      onPressTransactionProposal={(proposal) =>
        handlePressTransactionProposal(
          tagSafeTransactionProposal(proposal),
          wallet,
        )
      }
      onSync={handleSync}
    />
  ) : null;
}
