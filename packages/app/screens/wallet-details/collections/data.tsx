import {
  faChevronDown,
  faChevronUp,
  faEye,
  faEyeSlash,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import { faHexagonImage } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { ethers } from 'ethers';
import _, { chunk, isArray } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { RefreshControl, StyleProp, ViewStyle } from 'react-native';
import EmptyNfts from '../../../assets/images/empty-nfts.svg';
import { formatCrypto, formatMoney } from '../../../common/format/number';
import { Loadable, VoidPromiseFunction } from '../../../common/types';
import { tuple } from '../../../common/utils/functions';
import {
  composeLoadables,
  mapLoadable,
  onLoadable,
} from '../../../common/utils/query';
import { adjust, withSize } from '../../../common/utils/style';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { NFTAvatar } from '../../../components/avatar/nft-avatar';
import { Blur } from '../../../components/blur';
import { BaseButton } from '../../../components/button/base-button';
import {
  CardEmptyState,
  CardErrorState,
} from '../../../components/card/card-empty-state';
import { SectionList } from '../../../components/flashlist/section-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Image } from '../../../components/image';
import { ListItem } from '../../../components/list/list-item';
import {
  AssetListItemSkeleton,
  NFTBlockItemSkeleton,
} from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { SCREEN_WIDTH, colors } from '../../../design/constants';
import { getChainInfo } from '../../../features/chain';
import { useSafeAreaInsets } from '../../../features/safe-area';
import {
  IBlockchainType,
  IContractVisibility,
  INftBalance,
  INftCollectionMetadata,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { walletDetailBottomTabOffset } from '../navigation/tab-bar-floating';

function collectionKey(collection: string, chainId: number) {
  return `${collection}:${chainId}`;
}

const isHidden = (
  nft: INftBalance,
  map: Record<string, IContractVisibility>,
) => {
  const isOriginalVisible = nft.visibility !== IContractVisibility.Hidden;
  const modifiedVisibility =
    map[collectionKey(nft.collectionMetadata.address, nft.chainId)];
  return (
    modifiedVisibility === IContractVisibility.Hidden ||
    (!modifiedVisibility && !isOriginalVisible)
  );
};

interface DisplayListSectionType {
  collection: INftCollectionMetadata;
  chainId: number;
  isShown: boolean;
  data: INftBalance[];
}

interface DisplayGridSectionType {
  collection: INftCollectionMetadata;
  chainId: number;
  isShown: boolean;
  data: INftBalance[][];
}

interface CollectionsWithDataProps {
  wallet: IWallet;
  nfts: Loadable<INftBalance[]>;
  allNfts: Loadable<INftBalance[]>;
  display: 'list' | 'grid';
  refreshing: boolean;
  managed: boolean;
  modifiedVisibilityMap: Record<string, IContractVisibility>;
  onPressNft: (nft: INftBalance) => void;
  onLoadMore: VoidPromiseFunction;
  onRefresh: VoidPromiseFunction;
  onVisibilityChange: (
    collection: string,
    chainId: number,
    visibility: IContractVisibility,
  ) => void;
}

export function CollectionsWithData(props: CollectionsWithDataProps) {
  const {
    wallet,
    nfts,
    allNfts,
    display,
    refreshing,
    managed,
    modifiedVisibilityMap,
    onPressNft,
    onLoadMore,
    onRefresh,
    onVisibilityChange,
  } = props;
  const inset = useSafeAreaInsets();

  const [visibility, setVisibility] = useState<Record<string, boolean>>({});

  const blockSize = Math.floor((SCREEN_WIDTH - 80) / 2);

  const collections = mapLoadable(managed ? allNfts : nfts)((nfts) =>
    _.chain(nfts)
      .groupBy((nft) => nft.collectionMetadata.address)
      .toArray()
      .value(),
  );
  const collectionGroups = mapLoadable(collections)((collections) =>
    collections.map((collection) => ({
      collection: collection[0]!.collectionMetadata,
      chainId: collection[0]!.chainId,
      isShown:
        visibility[
          collectionKey(
            collection[0]!.collectionMetadata.address,
            collection[0]!.chainId,
          )
        ] !== false,
      data: collection,
    })),
  );

  // This is needed since a section list can only render 1 column
  const collectionPairGroups = mapLoadable(collections)((collections) =>
    collections.map((collection) => ({
      collection: collection[0]!.collectionMetadata,
      chainId: collection[0]!.chainId,
      isShown:
        visibility[
          collectionKey(
            collection[0]!.collectionMetadata.address,
            collection[0]!.chainId,
          )
        ] !== false,
      data: chunk(collection, 2),
    })),
  );

  const renderHeader = ({
    section: { collection, chainId, isShown, data },
  }: {
    section: DisplayListSectionType | DisplayGridSectionType;
  }) => {
    const first = isArray(data[0]!) ? data[0][0]! : data[0]!;
    const hidden = isHidden(first, modifiedVisibilityMap);
    return (
      <View
        className={cn(
          'bg-card mx-4 flex flex-row items-center justify-between space-x-4 rounded-t-2xl px-4 py-3',
          {
            'opacity-50': hidden,
            'rounded-t-2xl': isShown,
            'mb-3 rounded-2xl': !isShown,
          },
        )}
      >
        <HeaderInfo collection={collection} chainId={chainId} />
        {!managed ? (
          <BaseButton
            onPress={() =>
              setVisibility({
                ...visibility,
                [`${collection.address}:${chainId}`]: !isShown,
              })
            }
          >
            <View className='flex flex-row items-center space-x-2'>
              <Text className='text-text-secondary text-sm font-medium'>
                {data.flat().length.toString()}
              </Text>
              <FontAwesomeIcon
                icon={isShown ? faChevronUp : faChevronDown}
                color={colors.textSecondary}
                size={adjust(14, 2)}
              />
            </View>
          </BaseButton>
        ) : (
          <BaseButton
            onPress={() =>
              onVisibilityChange(
                collection.address,
                chainId,
                hidden ? IContractVisibility.Shown : IContractVisibility.Hidden,
              )
            }
          >
            <View
              className='bg-card-highlight items-center justify-center rounded-full'
              style={withSize(adjust(22, 2))}
            >
              <FontAwesomeIcon
                icon={hidden ? faEyeSlash : faEye}
                color={colors.textSecondary}
                size={adjust(14, 2)}
              />
            </View>
          </BaseButton>
        )}
      </View>
    );
  };

  const renderListItem = ({
    item,
    section,
  }: {
    item: INftBalance;
    section: DisplayListSectionType;
  }) =>
    section.isShown ? (
      <NFTListItem
        nft={item}
        isEnd={section.data[section.data.length - 1] === item}
        blockchain={wallet.blockchain}
        hidden={isHidden(item, modifiedVisibilityMap)}
        onPress={() => onPressNft(item)}
      />
    ) : null;

  const renderGridItem = ({
    item,
    section,
  }: {
    item: INftBalance[];
    section: DisplayGridSectionType;
  }) =>
    section.isShown ? (
      <View
        className={cn('bg-card mx-4 flex flex-row space-x-4 px-4', {
          'opacity-50': isHidden(item[0]!, modifiedVisibilityMap),
          'mb-3 rounded-b-2xl pb-4':
            section.data[section.data.length - 1] === item,
          'pb-3': section.data[section.data.length - 1] !== item,
        })}
      >
        <NFTBlockItem
          nft={item[0]!}
          blockchain={wallet.blockchain}
          size={blockSize}
          onPress={() => onPressNft(item[0]!)}
        />
        {item[1] && (
          <NFTBlockItem
            nft={item[1]!}
            blockchain={wallet.blockchain}
            size={blockSize}
            onPress={() => onPressNft(item[1]!)}
          />
        )}
      </View>
    ) : null;

  return onLoadable(
    composeLoadables(collectionGroups, collectionPairGroups)(tuple),
  )(
    () =>
      display === 'grid' ? (
        <View className='flex flex-row flex-wrap space-x-4 px-4 pt-2'>
          <NFTBlockItemSkeleton size={blockSize} />
          <NFTBlockItemSkeleton size={blockSize} />
        </View>
      ) : (
        <View className='flex flex-col'>
          <AssetListItemSkeleton />
          <AssetListItemSkeleton />
        </View>
      ),
    () => (
      <View className='flex flex-col'>
        <AssetListItemSkeleton fixed />
        <AssetListItemSkeleton fixed />
        <View className='-mt-16 items-center justify-center'>
          <CardErrorState
            title='Unable to get NFTs'
            description='Something went wrong trying to get your NFTs.'
          />
        </View>
      </View>
    ),
    ([collectionGroups, collectionPairGroups]) =>
      collectionGroups.length === 0 ? (
        <View className='flex flex-col'>
          <AssetListItemSkeleton fixed />
          <AssetListItemSkeleton fixed />
          <View className='-mt-16 items-center justify-center'>
            <CardEmptyState
              icon={EmptyNfts}
              title='No NFTs'
              description='You do not have any NFTs.'
            />
          </View>
        </View>
      ) : display === 'list' ? (
        <SectionList<INftBalance, DisplayListSectionType>
          sections={collectionGroups}
          extraData={{
            modifiedVisibilityMap,
            managed,
          }}
          estimatedItemSize={adjust(60)}
          onEndReached={onLoadMore}
          renderItem={renderListItem}
          renderSectionHeader={renderHeader}
          keyExtractor={(item) =>
            `list:${item.address}:${item.tokenId}:${item.chainId}`
          }
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              progressBackgroundColor={colors.cardHighlight}
              tintColor={colors.primary}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: inset.bottom + walletDetailBottomTabOffset - 12,
          }}
        />
      ) : (
        <SectionList<INftBalance[], DisplayGridSectionType>
          sections={collectionPairGroups}
          extraData={{
            modifiedVisibilityMap,
            managed,
          }}
          estimatedItemSize={blockSize + 64}
          onEndReached={onLoadMore}
          renderItem={renderGridItem}
          renderSectionHeader={renderHeader}
          keyExtractor={(item) =>
            `grid:${item[0]!.address}:${item[0]!.tokenId}:${item[0]!.chainId}-
            ${item[1]?.address}:${item[1]?.tokenId}:${item[1]?.chainId}`
          }
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              progressBackgroundColor={colors.cardHighlight}
              tintColor={colors.primary}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom: inset.bottom + walletDetailBottomTabOffset - 12,
          }}
        />
      ),
  );
}

const HeaderInfo = styled(function (props: {
  collection: INftCollectionMetadata;
  chainId: number;
}) {
  const { collection, chainId } = props;

  const [error, setError] = useState(false);

  return (
    <View className='flex flex-1 flex-row items-center space-x-3'>
      <View style={withSize(adjust(24, 2))}>
        {collection.imageUrl && !error ? (
          <Image
            source={collection.imageUrl}
            style={{
              ...withSize(adjust(24, 2)),
              borderRadius: 9999,
            }}
            onError={() => setError(true)}
          />
        ) : (
          <View
            className='bg-card-highlight items-center justify-center rounded-full'
            style={withSize(adjust(24, 2))}
          >
            <FontAwesomeIcon
              icon={faHexagonImage}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
          </View>
        )}
        <View className='absolute -bottom-1 -right-1'>
          <ChainAvatar
            chainInfo={getChainInfo(chainId)}
            size={adjust(12, 2)}
            border={true}
          />
        </View>
      </View>
      <Text
        className='text-text-primary truncate text-sm font-medium'
        numberOfLines={1}
      >
        {collection.name}
      </Text>
    </View>
  );
});

const NFTListItem = styled(function (props: {
  nft: INftBalance;
  isEnd: boolean;
  blockchain: IBlockchainType;
  hidden: boolean;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { nft, isEnd, blockchain, hidden, onPress, style } = props;

  const size = adjust(36);

  return (
    <View
      className={cn('bg-card mx-4', {
        'mb-3 rounded-b-2xl pb-3': isEnd,
        'opacity-50': hidden,
      })}
    >
      <ListItem onPress={onPress} style={style}>
        <View className='flex flex-row items-center justify-between space-x-2 px-4 py-3'>
          <View className='flex flex-1 flex-row items-center space-x-4'>
            <View
              style={{
                height: size,
                width: size,
                borderRadius: 8,
              }}
            >
              <NFTAvatar
                url={nft.nftMetadata.imagePreviewUrl}
                size={size}
                borderRadius={8}
              />
              {parseFloat(nft.balance) > 1 && (
                <View className='absolute bottom-0 w-full'>
                  <Blur className='overflow-hidden rounded-md' intensity={6}>
                    <View className='bg-background/10 flex h-3 flex-row items-center justify-center space-x-[1px] rounded-md'>
                      <View className='pt-[2px]'>
                        <FontAwesomeIcon
                          icon={faTimes}
                          size={6}
                          color={colors.textPrimary}
                        />
                      </View>
                      <Text className='text-text-primary text-xss font-normal'>
                        {nft.balance}
                      </Text>
                    </View>
                  </Blur>
                </View>
              )}
            </View>

            <View className='flex flex-1 flex-col'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {nft.nftMetadata.name}
              </Text>
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {blockchain !== IBlockchainType.Svm
                  ? `#${nft.tokenId}`
                  : nft.collectionMetadata.symbol}
              </Text>
            </View>

            <View className='flex flex-col items-end'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {`${formatCrypto(
                  nft.collectionMetadata.floorPrice,
                  nft.collectionMetadata.priceTokenMetadata.decimals,
                )} ${nft.collectionMetadata.priceTokenMetadata.symbol}`}
              </Text>
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {`${formatMoney(
                  parseFloat(nft.collectionMetadata.priceTokenMetadata.price) *
                    parseFloat(
                      ethers.formatUnits(
                        nft.collectionMetadata.floorPrice,
                        nft.collectionMetadata.priceTokenMetadata.decimals,
                      ),
                    ),
                )}`}
              </Text>
            </View>
          </View>
        </View>
      </ListItem>
    </View>
  );
});

const NFTBlockItem = styled(function (props: {
  nft: INftBalance;
  blockchain: IBlockchainType;
  size: number;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { nft, blockchain, size, onPress, style } = props;

  return (
    <View
      className='bg-card-highlight flex flex-col rounded-2xl'
      style={[
        style,
        {
          height: size + 64,
          width: size,
        },
      ]}
    >
      <BaseButton onPress={onPress}>
        <View style={withSize(size)}>
          <NFTAvatar
            url={nft.nftMetadata.imagePreviewUrl}
            size={size}
            borderRadius={16}
          />
          {parseFloat(nft.balance) > 1 && (
            <View className='absolute bottom-2 right-2'>
              <Blur className='overflow-hidden rounded-lg' intensity={6}>
                <View className='bg-background/10 flex h-5 flex-row items-center justify-center space-x-[1px] rounded-lg px-2'>
                  <View className='pt-[2px]'>
                    <FontAwesomeIcon
                      icon={faTimes}
                      size={adjust(10, 2)}
                      color={colors.textPrimary}
                    />
                  </View>
                  <Text className='text-text-primary text-xs font-normal'>
                    {nft.balance}
                  </Text>
                </View>
              </Blur>
            </View>
          )}
        </View>
      </BaseButton>
      <View className='space-y-0.5 px-2 pt-3'>
        <Text
          className='text-text-primary truncate text-sm font-medium'
          numberOfLines={1}
        >
          {nft.nftMetadata.name}
        </Text>
        <Text
          className='text-text-secondary truncate text-xs font-normal'
          numberOfLines={1}
        >
          {blockchain !== IBlockchainType.Svm
            ? `#${nft.tokenId}`
            : nft.collectionMetadata.symbol}
        </Text>
      </View>
    </View>
  );
});
