import { faCircleNodes } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isArray, isNil } from 'lodash';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Loadable } from '../../../common/types';
import {
  makeLoadable,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../../common/utils/query';
import { adjust, withSize } from '../../../common/utils/style';
import { isCryptoBalance } from '../../../common/utils/types';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { CardErrorState } from '../../../components/card/card-empty-state';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { SearchInput } from '../../../components/search-input';
import { AssetListItemSkeleton } from '../../../components/skeleton/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { SCREEN_HEIGHT, SCREEN_WIDTH, colors } from '../../../design/constants';
import { isValidTokenAddress } from '../../../features/blockchain/utils';
import { ChainId, ChainInfo, onBlockchain } from '../../../features/chain';
import { cryptoKey } from '../../../features/crypto/utils';
import { useSafeAreaInsets } from '../../../features/safe-area';
import {
  useUnknownMultichainSwappableTokenQuery,
  useUnknownSwappableTokenQuery,
} from '../../../features/swap';
import {
  IBlockchainType,
  ICryptoBalance,
  INftBalance,
} from '../../../graphql/client/generated/graphql';
import { useAudioContext } from '../../../provider/audio';
import { CryptoListItem } from './crypto-list-item';
import { NFTListItem } from './nft-list-item';

export function AssetSelect(props: {
  blockchain: IBlockchainType;
  chainIdOverride?: number;
  cryptos: Loadable<ICryptoBalance[] | Record<number, ICryptoBalance[]>>;
  nfts?: Loadable<INftBalance[]>;
  chains?: ChainInfo[];
  value?: ICryptoBalance | INftBalance;
  hideNFTs?: boolean;
  hidePrice?: boolean;
  maxItems?: number;
  searchUnknown?: boolean;
  searchColor?: string;
  search?: string;
  disabled?: boolean;
  estimatedHeight?: number;
  onChange: (balance: ICryptoBalance | INftBalance) => void;
}) {
  const {
    blockchain,
    chainIdOverride,
    cryptos,
    nfts = makeLoadable([]),
    chains,
    value,
    hideNFTs,
    hidePrice,
    maxItems,
    searchUnknown = false,
    search,
    disabled,
    searchColor,
    estimatedHeight,
    onChange,
  } = props;
  const { pressSound } = useAudioContext().sounds;

  const [_searchInput, setSearchInput] = useState('');
  const [showCrypto, setShowCrypto] = useState(
    !value || isCryptoBalance(value),
  );
  const [chainIdEvm, setChainIdEvm] = useState(
    chainIdOverride ?? ChainId.Ethereum,
  );

  const searchInput = isNil(search) ? _searchInput : search;
  const chainId = onBlockchain(blockchain)(
    () => chainIdEvm,
    () => ChainId.Solana,
    () => ChainId.Ton,
  );
  const textSearch = searchInput.toLowerCase();
  const addressSearch = onBlockchain(blockchain)(
    () => textSearch,
    () => searchInput,
    () => searchInput,
  );

  const matchCrypto = (crypto: ICryptoBalance) => {
    const matchesText =
      crypto.tokenMetadata.name.toLowerCase().includes(textSearch) ||
      crypto.tokenMetadata.symbol.toLowerCase().includes(textSearch);
    const matchesAddress = onBlockchain(blockchain)(
      () => crypto.address.toLowerCase() === addressSearch,
      () => crypto.address === addressSearch,
      () => crypto.address === addressSearch,
    );
    return matchesText || matchesAddress;
  };

  const matchNft = (nft: INftBalance) => {
    const matchesText =
      nft.collectionMetadata.name.toLowerCase().includes(textSearch) ||
      nft.collectionMetadata.symbol.toLowerCase().includes(textSearch);
    const matchesAddress = onBlockchain(blockchain)(
      () => nft.address.toLowerCase() === addressSearch,
      () => nft.address === addressSearch,
      () => nft.address === addressSearch,
    );
    return matchesText || matchesAddress;
  };

  const filteredCrypto = useMemo(
    () =>
      mapLoadable(cryptos)((cryptos) => {
        if (isArray(cryptos)) {
          return cryptos.filter(matchCrypto).slice(0, maxItems);
        } else if (chainId === 0) {
          const allCrypto = Object.values(cryptos);
          const validCrypto: ICryptoBalance[] = [];
          const copy: Record<string, boolean> = {};
          allCrypto.forEach((crypto) => {
            crypto.forEach((token) => {
              const key = cryptoKey(token);
              const used = copy[key] ?? false;
              const valid = matchCrypto(token) && !used;
              if (valid) {
                validCrypto.push(token);
              }
              if (!used) {
                copy[key] = true;
              }
            });
          });
          return validCrypto.slice(0, maxItems);
        } else {
          return cryptos[chainId]!.filter(matchCrypto).slice(0, maxItems);
        }
      }),
    [...spreadLoadable(cryptos), maxItems, searchInput, chainId, blockchain],
  );
  const filteredNfts = useMemo(
    () => mapLoadable(nfts)((nfts) => nfts.filter(matchNft).slice(0, maxItems)),
    [...spreadLoadable(nfts), maxItems, searchInput, blockchain],
  );

  const shouldFetchUnknown =
    searchUnknown &&
    showCrypto &&
    filteredCrypto.success &&
    filteredCrypto.data.length === 0 &&
    isValidTokenAddress(blockchain, addressSearch);

  const unknownToken = useUnknownSwappableTokenQuery(chainId, addressSearch, {
    enabled: shouldFetchUnknown && chainId !== 0,
    staleTime: Infinity,
  });

  const unknownTokens = useUnknownMultichainSwappableTokenQuery(
    addressSearch,
    blockchain,
    {
      enabled: shouldFetchUnknown && chainId === 0,
      staleTime: Infinity,
    },
  );

  const unknownFound =
    chainId === 0
      ? unknownTokens
      : mapLoadable(unknownToken)((token) => [token]);

  const renderChainItem = ({
    item,
    extraData,
  }: RenderItemProps<ChainInfo, number>) => (
    <BaseButton
      pressSound={pressSound}
      onPress={() => setChainIdEvm(item.id)}
      scale={0.9}
    >
      <ChainAvatar
        chainInfo={item}
        size={adjust(28, 8)}
        shape='square'
        disabled={item.id !== extraData}
      />
    </BaseButton>
  );

  return (
    <View
      className='flex h-full w-full flex-1 flex-col'
      pointerEvents={disabled ? 'none' : undefined}
    >
      {isNil(search) && (
        <View className='flex flex-row items-center space-x-1 px-4'>
          <SearchInput
            inputProps={{
              placeholder: 'Search tokens',
              onChangeText: (value) => setSearchInput(value),
              value: searchInput,
              editable: !disabled,
            }}
            backgroundColor={searchColor}
            onClear={() => setSearchInput('')}
          />
        </View>
      )}
      {!hideNFTs && (
        <View className='mt-4 flex flex-row space-x-2 px-4'>
          <BaseButton
            className='rounded-xl'
            onPress={() => setShowCrypto(true)}
          >
            <View
              className={cn('rounded-xl px-4 py-2 font-bold', {
                'bg-card-highlight': showCrypto,
              })}
            >
              <Text className='text-text-primary text-sm font-medium'>
                {'Tokens'}
              </Text>
            </View>
          </BaseButton>

          <BaseButton
            className='overflow-hidden rounded-t-lg'
            onPress={() => setShowCrypto(false)}
          >
            <View
              className={cn('rounded-xl px-4 py-2 font-bold', {
                'bg-card-highlight': !showCrypto,
              })}
            >
              <Text className='text-text-primary text-sm font-medium'>
                {'NFTs'}
              </Text>
            </View>
          </BaseButton>
        </View>
      )}

      {chains && chains.length > 1 ? (
        <View className='flex flex-col px-4 pt-2'>
          <View className='w-full' style={styles.container}>
            <FlatList
              data={chains}
              horizontal={true}
              renderItem={renderChainItem}
              extraData={chainIdEvm}
              ListHeaderComponent={() => (
                <BaseButton
                  className='pr-2'
                  pressSound={pressSound}
                  onPress={() => setChainIdEvm(0)}
                  scale={0.9}
                >
                  <View
                    className='items-center justify-center rounded-md'
                    style={{
                      ...withSize(adjust(28, 8)),
                      backgroundColor:
                        chainIdEvm !== 0
                          ? searchColor ?? colors.card
                          : searchColor === colors.cardHighlight
                          ? colors.cardHighlightSecondary
                          : colors.cardHighlight,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faCircleNodes}
                      size={adjust(16)}
                      color={colors.textSecondary}
                    />
                  </View>
                </BaseButton>
              )}
              ItemSeparatorComponent={() => <View className='w-2' />}
              estimatedItemSize={styles.chainList.height}
              estimatedListSize={styles.chainList}
              keyExtractor={(chain) => chain.id.toString()}
            />
          </View>
        </View>
      ) : null}

      {showCrypto
        ? shouldFetchUnknown
          ? onLoadable(unknownFound)(
              () => (
                <View className='flex flex-col'>
                  <AssetListItemSkeleton />
                  <AssetListItemSkeleton />
                  <View className='flex flex-col items-center justify-center px-8 py-6'>
                    <Text className='text-text-primary text-base font-medium'>
                      Searching...
                    </Text>
                    <Text className='text-text-secondary text-xs font-normal'>
                      Fetching token data on chain
                    </Text>
                  </View>
                </View>
              ),
              () => <NoResultsFound search={searchInput} type='crypto' />,
              (data) =>
                data.length === 0 ? (
                  <NoResultsFound search={searchInput} type='crypto' />
                ) : (
                  <View className='h-full flex-1'>
                    <CryptoList
                      cryptos={data}
                      onSelect={onChange}
                      estimatedHeight={estimatedHeight}
                      selectedValue={
                        value && !isCryptoBalance(value) ? undefined : value
                      }
                      hidePrice={hidePrice}
                    />
                  </View>
                ),
            )
          : onLoadable(filteredCrypto)(
              () => (
                <View className='flex flex-col'>
                  <AssetListItemSkeleton />
                  <AssetListItemSkeleton />
                </View>
              ),
              () => (
                <View className='flex flex-col'>
                  <AssetListItemSkeleton fixed />
                  <AssetListItemSkeleton fixed />
                  <View className='-mt-4 items-center justify-center'>
                    <CardErrorState
                      title={`Unable to get Tokens`}
                      description={`Something went wrong trying to get available tokens.`}
                    />
                  </View>
                </View>
              ),
              (crypto) =>
                crypto.length === 0 ? (
                  <NoResultsFound search={searchInput} type='crypto' />
                ) : (
                  <View className='h-full flex-1'>
                    <CryptoList
                      cryptos={crypto}
                      onSelect={onChange}
                      estimatedHeight={estimatedHeight}
                      selectedValue={
                        value && !isCryptoBalance(value) ? undefined : value
                      }
                      hidePrice={hidePrice}
                    />
                  </View>
                ),
            )
        : onLoadable(filteredNfts)(
            () => (
              <View className='flex flex-col'>
                <AssetListItemSkeleton />
                <AssetListItemSkeleton />
              </View>
            ),
            () => (
              <View className='flex flex-col'>
                <AssetListItemSkeleton fixed />
                <AssetListItemSkeleton fixed />
                <View className='-mt-4 items-center justify-center'>
                  <CardErrorState
                    title={`Unable to get NFTs`}
                    description={`Something went wrong trying to get available NFTs.`}
                  />
                </View>
              </View>
            ),
            (filteredNfts) =>
              filteredNfts.length > 0 ? (
                <View className='h-full flex-1'>
                  <NFTList
                    nfts={filteredNfts}
                    estimatedHeight={estimatedHeight}
                    onSelect={onChange}
                    selectedValue={
                      value && isCryptoBalance(value) ? undefined : value
                    }
                  />
                </View>
              ) : (
                <NoResultsFound search={searchInput} type='nfts' />
              ),
          )}
    </View>
  );
}

export function CryptoList(props: {
  cryptos: ICryptoBalance[];
  hidePrice?: boolean;
  estimatedHeight?: number;
  onSelect: (crypto: ICryptoBalance) => void;
  selectedValue?: ICryptoBalance;
}) {
  const { cryptos, onSelect, estimatedHeight, selectedValue, hidePrice } =
    props;
  const inset = useSafeAreaInsets();

  const renderItem = ({ item }: RenderItemProps<ICryptoBalance>) => (
    <CryptoListItem
      balance={item}
      onPress={() => onSelect(item)}
      hidePrice={hidePrice}
    />
  );

  return (
    <View className='mt-2 h-full flex-1'>
      <FlatList
        data={cryptos}
        estimatedItemSize={adjust(64)}
        estimatedListSize={
          estimatedHeight
            ? {
                height: estimatedHeight,
                width: SCREEN_WIDTH,
              }
            : undefined
        }
        renderItem={renderItem}
        keyExtractor={(item) => cryptoKey(item)}
        contentContainerStyle={{ paddingBottom: inset.bottom }}
      />
    </View>
  );
}

export function NFTList(props: {
  nfts: INftBalance[];
  estimatedHeight?: number;
  onSelect: (nft: INftBalance) => void;
  selectedValue?: INftBalance;
}) {
  const { nfts, selectedValue, estimatedHeight, onSelect } = props;
  const inset = useSafeAreaInsets();

  const renderItem = ({ item }: RenderItemProps<INftBalance>) => (
    <NFTListItem
      chainId={item.chainId}
      balance={item}
      onPress={() => onSelect(item)}
    />
  );

  return (
    <View className='mt-2 h-full flex-1'>
      <FlatList
        data={nfts}
        estimatedItemSize={adjust(64)}
        estimatedListSize={{
          height: estimatedHeight ?? SCREEN_HEIGHT * 0.75,
          width: SCREEN_WIDTH,
        }}
        renderItem={renderItem}
        keyExtractor={(item) =>
          `${item.chainId}:${item.address}:${item.tokenId}`
        }
        contentContainerStyle={{ paddingBottom: inset.bottom }}
      />
    </View>
  );
}

function NoResultsFound(props: { search: string; type: 'crypto' | 'nfts' }) {
  const { search, type } = props;

  return (
    <View className='flex w-full flex-col overflow-hidden'>
      <AssetListItemSkeleton fixed />
      <AssetListItemSkeleton fixed />
      <View className='-mt-2 flex flex-col items-center justify-center px-4'>
        <Text className='text-text-primary text-sm font-medium'>
          No Results
        </Text>
        {search === '' ? (
          <View className='mt-2 flex flex-row overflow-x-hidden'>
            <Text className='text-text-secondary flex-none text-center text-xs font-normal'>
              {`No ${type === 'crypto' ? 'tokens' : 'NFTs'} found`}
            </Text>
          </View>
        ) : (
          <View className='mt-2 flex flex-col items-center'>
            <Text className='text-text-secondary text-xs font-normal'>
              {`Cannot find any ${type === 'crypto' ? 'tokens' : 'NFTs'} for `}
            </Text>
            <Text className='text-text-primary text-xs font-medium'>
              {search}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: adjust(28, 8),
  },
  chainList: {
    height: adjust(28, 8),
    width: SCREEN_WIDTH,
  },
});
