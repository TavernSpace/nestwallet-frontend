import { View } from '@nestwallet/app/components/view';
import {
  IMessageProposal,
  ITransaction,
  ITransactionProposal,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { useWalletContext } from '@nestwallet/app/provider/wallet';
import { WalletTransactions } from '@nestwallet/app/screens/wallet-details/transactions';
import { hasWalletBanner } from '@nestwallet/app/screens/wallet-details/wallet-header';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSignerWallet } from '../../../../hooks/signer';

export function WalletTransactionsTab() {
  const { wallet } = useWalletContext();
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();

  const handlePressMessageProposal = (message: IMessageProposal) => {
    navigation.navigate('app', {
      screen: 'messageProposal',
      params: {
        messageId: message.id,
        walletId: wallet.id,
      },
    });
  };

  const handlePressTransactionProposal = (proposal: ITransactionProposal) => {
    navigation.navigate('app', {
      screen: 'transactionProposal',
      params: {
        proposalId: proposal.id,
        walletId: wallet.id,
      },
    });
  };

  const handlePressTransaction = (transaction: ITransaction) => {
    navigation.navigate('app', {
      screen: 'transaction',
      params: {
        transaction,
        walletId: wallet.id,
      },
    });
  };

  const { bannerCount } = hasWalletBanner(useSignerWallet(wallet));
  const headerHeight = 40 + Math.max(16, top) + 48 * bannerCount;

  return (
    <View className='h-full w-full' style={{ paddingTop: headerHeight }}>
      <WalletTransactions
        wallet={wallet}
        onPressMessageProposal={handlePressMessageProposal}
        onPressTransactionProposal={handlePressTransactionProposal}
        onPressTransaction={handlePressTransaction}
      />
    </View>
  );
}
