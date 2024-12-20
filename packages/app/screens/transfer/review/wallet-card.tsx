import { formatAddress } from '../../../common/format/address';
import { adjust } from '../../../common/utils/style';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { IWallet } from '../../../graphql/client/generated/graphql';

export function WalletCard(props: { wallet: IWallet }) {
  const { wallet } = props;
  return (
    <View className='bg-card mb-2 flex flex-row space-x-3 rounded-xl px-4 py-3'>
      <View>
        <WalletAvatar
          wallet={wallet}
          size={adjust(36)}
          borderColor={colors.card}
        />
      </View>
      <View className='flex flex-col'>
        <Text
          className='text-text-primary truncate text-sm font-medium'
          numberOfLines={1}
        >
          {wallet.name}
        </Text>
        <Text
          className='text-text-secondary truncate text-xs font-normal'
          numberOfLines={1}
        >
          {formatAddress(wallet.address)}
        </Text>
      </View>
    </View>
  );
}
