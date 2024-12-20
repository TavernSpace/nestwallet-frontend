import { formatAddress } from '../../../common/format/address';
import { formatCrypto, formatMoney } from '../../../common/format/number';
import { adjust, withSize } from '../../../common/utils/style';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ICryptoBalance } from '../../../graphql/client/generated/graphql';
import { useAudioContext } from '../../../provider/audio';

export function CryptoListItem(props: {
  balance: ICryptoBalance;
  hidePrice?: boolean;
  onPress?: VoidFunction;
}) {
  const { balance, hidePrice, onPress } = props;
  const { name, symbol, imageUrl, decimals } = balance.tokenMetadata;
  const { pressSound } = useAudioContext().sounds;

  const size = adjust(36);

  return (
    <ListItem onPress={onPress} pressSound={pressSound}>
      <View className='flex flex-row items-center justify-between space-x-2 px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-4'>
          <View
            className='flex flex-row items-center justify-center rounded-full'
            style={withSize(size)}
          >
            <CryptoAvatar
              url={imageUrl}
              chainId={balance.chainId}
              symbol={symbol}
              size={size}
            />
          </View>
          <View className='flex-1 pr-4'>
            <Text
              className='text-text-primary truncate text-sm font-medium'
              numberOfLines={1}
            >
              {name ? name : formatAddress(balance.address)}
            </Text>
            <Text
              className='text-text-secondary truncate text-xs font-normal'
              numberOfLines={1}
            >
              {symbol}
            </Text>
          </View>
        </View>
        <View className='flex-shrink-0 flex-col items-end text-right'>
          <Text className='text-text-primary text-sm font-medium'>
            {formatCrypto(balance.balance, decimals)}
          </Text>
          {!hidePrice && (
            <Text className='text-text-secondary text-xs font-normal'>
              {formatMoney(parseFloat(balance.balanceInUSD))}
            </Text>
          )}
        </View>
      </View>
    </ListItem>
  );
}
