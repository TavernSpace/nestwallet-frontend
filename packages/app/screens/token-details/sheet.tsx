import { adjust } from '../../common/utils/style';
import { FlatList } from '../../components/flashlist/flat-list';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { View } from '../../components/view';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  ICryptoBalance,
  ITransaction,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { TokenHistoryCard } from './card';

interface TokenHistorySheetProps {
  transactions: ITransaction[];
  token: ICryptoBalance;
  wallet: IWallet;
  isShowing: boolean;
  onClose: VoidFunction;
  onPressTransaction: (transaction: ITransaction) => void;
}

export function TokenHistorySheet(props: TokenHistorySheetProps) {
  const {
    transactions,
    token,
    wallet,
    isShowing,
    onClose,
    onPressTransaction,
  } = props;
  const { bottom } = useSafeAreaInsets();

  const handlePress = (transaction: ITransaction) => {
    onClose();
    onPressTransaction(transaction);
  };

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      hasBottomInset={false}
      hasTopInset={true}
      isFullHeight={true}
    >
      <View className='flex h-full w-full flex-1 flex-col'>
        <ActionSheetHeader
          title='All History'
          onClose={onClose}
          type='fullscreen'
        />
        <FlatList
          data={transactions}
          estimatedItemSize={adjust(64)}
          scrollEnabled={true}
          renderItem={({ item }) => (
            <TokenHistoryCard
              transaction={item}
              token={token}
              wallet={wallet}
              onPress={() => handlePress(item)}
            />
          )}
          contentContainerStyle={{
            paddingBottom: bottom,
          }}
        />
      </View>
    </ActionSheet>
  );
}
