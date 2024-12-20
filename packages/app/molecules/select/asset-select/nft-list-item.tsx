import { formatCrypto } from '../../../common/format/number';
import { adjust, withSize } from '../../../common/utils/style';
import { NFTAvatar } from '../../../components/avatar/nft-avatar';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { INftBalance } from '../../../graphql/client/generated/graphql';

export function NFTListItem(props: {
  chainId: number;
  balance: INftBalance;
  onPress?: VoidFunction;
}) {
  const { balance, chainId, onPress } = props;

  const size = adjust(36);

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center justify-between space-x-2 px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-4'>
          <View
            className='flex flex-row items-center justify-center'
            style={withSize(size)}
          >
            <NFTAvatar
              url={balance.nftMetadata.imagePreviewUrl}
              chainId={chainId}
              size={size}
            />
          </View>
          <View className='flex-1 pr-4'>
            <Text className='text-text-primary truncate text-sm font-medium'>
              {balance.nftMetadata.name ||
                balance.collectionMetadata.name ||
                'Unknown NFT'}
            </Text>
            <Text
              className='text-text-secondary truncate text-xs font-normal'
              numberOfLines={1}
            >
              {balance.tokenId
                ? `#${balance.tokenId}`
                : balance.collectionMetadata.name}
            </Text>
          </View>
        </View>
        <View className='flex-shrink-0 flex-col items-end text-right'>
          <Text className='text-text-primary text-sm font-medium'>
            {balance.balance}
          </Text>
          <Text className='text-text-secondary text-xs font-normal'>
            {`${formatCrypto(
              balance.collectionMetadata.floorPrice,
              balance.collectionMetadata.priceTokenMetadata.decimals,
            )} ${balance.collectionMetadata.priceTokenMetadata.symbol}`}
          </Text>
        </View>
      </View>
    </ListItem>
  );
}
