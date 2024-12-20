import {
  faArrowUpRightFromSquare,
  faClone,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faHexagonVerticalNft,
  faPaperPlane,
} from '@fortawesome/pro-solid-svg-icons';
import { capitalize } from 'lodash';
import { Linking, View } from 'react-native';
import BlurLogo from '../../assets/images/logos/blur.png';
import GetGemsLogo from '../../assets/images/logos/getgems.svg';
import MagicEdenLogo from '../../assets/images/logos/magiceden.png';
import OpenSeaLogo from '../../assets/images/logos/opensea.png';
import TonDiamondsLogo from '../../assets/images/logos/ton_diamonds.svg';
import { formatAddress } from '../../common/format/address';
import { formatCrypto } from '../../common/format/number';
import { useCopy } from '../../common/hooks/copy';
import { useLinkToBlockchainExplorer } from '../../common/hooks/link';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { Loadable } from '../../common/types';
import { opacity } from '../../common/utils/functions';
import { onLoadable } from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { Blur } from '../../components/blur';
import { BaseButton } from '../../components/button/base-button';
import { Button } from '../../components/button/button';
import { ChainChip } from '../../components/chip';
import { Divider } from '../../components/divider';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { ScrollView } from '../../components/scroll';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { isSoulbound } from '../../features/evm/utils';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  INftAttribute,
  INftBalance,
  INftSaleData,
} from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

interface NftDetailsProps {
  nft: INftBalance;
  nftSaleData: Loadable<INftSaleData>;
  hideActions: boolean;
  onPressSend: VoidFunction;
}

export function NftDetails(props: NftDetailsProps) {
  const { nft, nftSaleData, hideActions, onPressSend } = props;
  const { language } = useLanguageContext();
  const { copy } = useCopy(localization.copiedContractAddress[language]);
  const { explore } = useLinkToBlockchainExplorer(nft.chainId, {
    type: 'address',
    data: nft.address,
  });
  const { bottom } = useSafeAreaInsets();

  useNavigationOptions({
    headerTitle: nft.collectionMetadata.name,
  });

  const getOpenSeaBaseURL = (chainId: number) => {
    switch (chainId) {
      case ChainId.Ethereum:
        return 'https://opensea.io/assets/ethereum';
      case ChainId.Optimism:
        return 'https://opensea.io/assets/optimism';
      case ChainId.Arbitrum:
        return 'https://opensea.io/assets/arbitrum';
      case ChainId.Avalanche:
        return 'https://opensea.io/assets/avalanche';
      case ChainId.BinanceSmartChain:
        return 'https://opensea.io/assets/bsc';
      case ChainId.Polygon:
        return 'https://opensea.io/assets/matic';
      default:
        return undefined;
    }
  };

  const handlePressOpenSea = (nft: INftBalance) => {
    Linking.openURL(
      `${getOpenSeaBaseURL(nft.chainId)}/${nft.collectionMetadata.address}/${
        nft.tokenId
      }`,
    );
  };

  const handlePressBlur = (nft: INftBalance) => {
    Linking.openURL(
      `https://blur.io/asset/${nft.collectionMetadata.address.toLowerCase()}/${
        nft.tokenId
      }`,
    );
  };

  const handlePressMagicEden = (nft: INftBalance) => {
    Linking.openURL(`https://magiceden.io/item-details/${nft.address}`);
  };

  const handlePressTonDiamonds = (nft: INftBalance) => {
    // TODO: figure out how to link directly to nft
    Linking.openURL(`https://ton.diamonds/`);
  };

  const handlePressGetGems = (nft: INftBalance) => {
    Linking.openURL(`https://getgems.io/nft/${nft.address}`);
  };

  const iconSize = adjust(14, 2);
  const nftChain = getChainInfo(nft.chainId);
  const soulbound = isSoulbound(nft.chainId, nft.address);
  const explorerName =
    nftChain?.blockExplorers?.default.name ?? localization.etherscan[language];

  return (
    <View className='absolute h-full w-full'>
      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: hideActions || soulbound ? bottom : 16,
        }}
      >
        <View className='flex flex-col px-4 pt-2'>
          <View className='bg-card w-full overflow-hidden rounded-t-3xl'>
            <View className='bg-card w-full overflow-hidden rounded-3xl'>
              {nft.nftMetadata.imageUrl ? (
                <Image
                  source={{ uri: nft.nftMetadata.imageUrl }}
                  style={{ height: 320 }}
                />
              ) : (
                <View className='bg-card-highlight h-80 w-full items-center justify-center'>
                  <FontAwesomeIcon
                    icon={faHexagonVerticalNft}
                    size={128}
                    color={colors.textSecondary}
                  />
                </View>
              )}
              {parseFloat(nft.balance) > 1 && (
                <View className='absolute bottom-2 right-2'>
                  <Blur className='overflow-hidden rounded-lg' intensity={6}>
                    <View className='bg-background/10 flex h-5 flex-row items-center justify-center space-x-[1px] rounded-lg px-2'>
                      <View className='pt-[2px]'>
                        <FontAwesomeIcon
                          icon={faTimes}
                          size={10}
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
          </View>
          <View className='bg-card flex w-full flex-row items-center justify-between rounded-b-3xl px-4 py-4'>
            <View className='flex flex-1 flex-col space-y-0.5'>
              <Text
                className='text-text-primary truncate text-base font-medium'
                numberOfLines={1}
              >
                {nft.nftMetadata.name}
              </Text>
              <BaseButton onPress={() => copy(nft.address)}>
                <View className='flex flex-row items-center space-x-1'>
                  <Text
                    className='text-text-secondary truncate text-sm font-normal'
                    numberOfLines={1}
                  >
                    {formatAddress(nft.address)}
                  </Text>
                  <FontAwesomeIcon
                    icon={faClone}
                    color={colors.textSecondary}
                    size={iconSize}
                  />
                </View>
              </BaseButton>
            </View>
            <View className='flex flex-row items-center space-x-1 pl-2'>
              {soulbound && (
                <View className='bg-soulbound/10 items-center justify-center rounded-full px-2 py-1'>
                  <Text className='text-soulbound text-xs font-medium'>
                    {localization.soulbound[language]}
                  </Text>
                </View>
              )}
              <ChainChip chainId={nft.chainId} />
            </View>
          </View>
        </View>
        {!soulbound && (
          <View className='mt-4'>
            <Text className='text-text-primary px-4 text-base font-medium'>
              {localization.market[language]}
            </Text>

            <View className='flex flex-row flex-wrap px-3 pt-2'>
              <Card
                title={localization.floorPrice[language]}
                subtitle={`${formatCrypto(
                  nft.collectionMetadata.floorPrice,
                  nft.collectionMetadata.priceTokenMetadata.decimals,
                )} ${nft.collectionMetadata.priceTokenMetadata.symbol}`}
              />
              {onLoadable(nftSaleData)(
                () => (
                  <Skeleton
                    className='m-1'
                    height={60}
                    width={100}
                    borderRadius={8}
                  />
                ),
                () => (
                  <Card
                    title={localization.lastSale[language]}
                    subtitle={'-'}
                  />
                ),
                (data) => (
                  <Card
                    title={localization.lastSale[language]}
                    subtitle={
                      data.lastSalePrice && data.priceTokenMetadata
                        ? `${formatCrypto(
                            data.lastSalePrice,
                            data.priceTokenMetadata.decimals,
                          )} ${data.priceTokenMetadata.symbol}`
                        : '-'
                    }
                  />
                ),
              )}
            </View>
          </View>
        )}
        <Divider className='mt-4' />
        <View className='mb-2 mt-4 px-4'>
          <Text className='text-text-primary text-base font-medium'>
            {localization.traits[language]}
          </Text>
        </View>
        {nft.nftMetadata.attributes.length > 0 ? (
          <View className='flex flex-row flex-wrap px-3'>
            {nft.nftMetadata.attributes.map(
              (attribute: INftAttribute, index: number) => {
                return (
                  <Card
                    title={capitalize(attribute.trait)}
                    subtitle={attribute.value}
                    key={index}
                  />
                );
              },
            )}
          </View>
        ) : (
          <View className='flex flex-row px-4'>
            <View className='bg-card rounded-lg px-3 py-2'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.noTraitsFound[language]}
              </Text>
            </View>
          </View>
        )}
        <Divider className='mt-4' />
        <View className='mt-4 px-4'>
          <Text className='text-text-primary text-base font-medium'>
            {localization.links[language]}
          </Text>
        </View>
        <View className='flex flex-row flex-wrap px-3 pt-1'>
          <BaseButton className='m-1' onPress={explore}>
            <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
              <FontAwesomeIcon
                icon={faArrowUpRightFromSquare}
                color={colors.textPrimary}
                size={adjust(14, 2)}
              />
              <Text className='text-text-primary text-sm font-normal'>
                {explorerName}
              </Text>
            </View>
          </BaseButton>
          {getOpenSeaBaseURL(nft.chainId) && (
            <BaseButton className='m-1' onPress={() => handlePressOpenSea(nft)}>
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image style={withSize(iconSize + 4)} source={OpenSeaLogo} />
                <Text className='text-text-primary text-sm font-normal'>
                  {localization.openseaNftSite[language]}
                </Text>
              </View>
            </BaseButton>
          )}
          {nft.chainId === 1 && (
            <BaseButton className='m-1' onPress={() => handlePressBlur(nft)}>
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image style={withSize(iconSize + 4)} source={BlurLogo} />
                <Text className='text-text-primary text-sm font-normal'>
                  {localization.blurNftSite[language]}
                </Text>
              </View>
            </BaseButton>
          )}
          {nft.chainId === ChainId.Solana && (
            <BaseButton
              className='m-1'
              onPress={() => handlePressMagicEden(nft)}
            >
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image style={withSize(iconSize + 4)} source={MagicEdenLogo} />
                <Text className='text-text-primary text-sm font-normal'>
                  {localization.magicEdenNftSite[language]}
                </Text>
              </View>
            </BaseButton>
          )}
          {nft.chainId === ChainId.Ton && (
            <BaseButton
              className='m-1'
              onPress={() => handlePressTonDiamonds(nft)}
            >
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image
                  style={withSize(iconSize + 4)}
                  source={TonDiamondsLogo}
                />
                <Text className='text-text-primary text-sm font-normal'>
                  {localization.tonDiamondsNftSite[language]}
                </Text>
              </View>
            </BaseButton>
          )}
          {nft.chainId === ChainId.Ton && (
            <BaseButton className='m-1' onPress={() => handlePressGetGems(nft)}>
              <View className='bg-card flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image style={withSize(iconSize + 4)} source={GetGemsLogo} />
                <Text className='text-text-primary text-sm font-normal'>
                  {localization.getGemsNftSite[language]}
                </Text>
              </View>
            </BaseButton>
          )}
        </View>
      </ScrollView>
      {!hideActions && !soulbound && (
        <View className='px-4 pt-2' style={{ paddingBottom: bottom }}>
          <Button
            type='primary'
            buttonColor={opacity(colors.send, 15)}
            onPress={onPressSend}
          >
            <FontAwesomeIcon
              className='mr-2 inline-block'
              color={colors.send}
              icon={faPaperPlane}
            />
            <Text className='text-send text-sm font-bold'>
              {localization.send[language]}
            </Text>
          </Button>
        </View>
      )}
    </View>
  );
}

function Card(props: { title: string; subtitle: string }) {
  const { title, subtitle } = props;
  return (
    <View className='bg-card m-1 flex flex-col space-y-1 rounded-lg px-3 py-2'>
      <Text className='text-text-secondary text-sm font-normal'>{title}</Text>
      <Text className='text-text-primary text-sm font-normal'>{subtitle}</Text>
    </View>
  );
}
