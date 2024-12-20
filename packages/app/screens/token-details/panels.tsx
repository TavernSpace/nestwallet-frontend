import { faMemo } from '@fortawesome/pro-solid-svg-icons';
import { memo, useState } from 'react';
import { Linking } from 'react-native';
import { birdEyeInverseChainMap } from '../../common/api/birdeye/utils';
import { dexScreenerInverseChainMap } from '../../common/api/dexscreener/utils';
import { getOriginIcon } from '../../common/utils/origin';
import { loadDataFromQuery, onLoadable } from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import {
  ICryptoBalance,
  ITransaction,
  IWallet,
  useTokenHistoryQuery,
} from '../../graphql/client/generated/graphql';
import { TokenHistoryCard } from './card';
import { TokenHistorySheet } from './sheet';

export const TokenHistoryPanel = memo(
  function (props: {
    wallet: IWallet;
    token: ICryptoBalance;
    onPressTransaction: (transaction: ITransaction) => void;
  }) {
    const { wallet, token, onPressTransaction } = props;

    const [showTokenHistorySheet, setShowTokenHistorySheet] = useState(false);

    const tokenHistoryQuery = useTokenHistoryQuery(
      {
        input: {
          walletId: wallet.id,
          chainID: [token.chainId],
          contractAddress: [token.address],
        },
      },
      { staleTime: 30 * 1000 },
    );
    const tokenHistory = loadDataFromQuery(
      tokenHistoryQuery,
      (data) => data.tokenHistory as ITransaction[],
    );

    return onLoadable(tokenHistory)(
      () => (
        <View className='mt-2 px-4'>
          <Skeleton width='100%' height={224} borderRadius={16} />
        </View>
      ),
      () => null,
      (tokenHistory) => (
        <View className='mt-2 flex flex-col'>
          {tokenHistory.length === 0 ? (
            <View className='bg-card mx-4 overflow-hidden rounded-2xl px-4 py-3'>
              <Text className='text-text-primary text-base font-medium'>
                History
              </Text>
              <View className='flex w-full flex-col items-center py-6'>
                <View
                  className='bg-primary/10 items-center justify-center rounded-full'
                  style={withSize(48)}
                >
                  <FontAwesomeIcon
                    icon={faMemo}
                    color={colors.primary}
                    size={24}
                  />
                </View>
                <View className='mt-3 flex flex-col items-center justify-center'>
                  <Text className='text-text-primary text-sm font-medium'>
                    {'No History Found'}
                  </Text>
                  <Text className='text-text-secondary text-center text-xs font-normal'>
                    {
                      'Your transactions involving this token will show up here.'
                    }
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='bg-card mx-4 overflow-hidden rounded-2xl pt-3'>
              <View className='px-4 pb-2'>
                <Text className='text-text-primary text-base font-medium'>
                  History
                </Text>
              </View>
              {tokenHistory.slice(0, 3).map((transaction, index) => (
                <TokenHistoryCard
                  key={index}
                  wallet={wallet}
                  token={token}
                  transaction={transaction}
                  onPress={() => onPressTransaction(transaction)}
                />
              ))}
              <View className='w-full px-4 pt-2'>
                <View className='bg-card-highlight h-[1px] w-full' />
              </View>
              <View className='w-full items-center justify-center'>
                <BaseButton
                  className='w-full'
                  onPress={() => setShowTokenHistorySheet(true)}
                  scale={0.99}
                >
                  <View className='flex w-full flex-row items-center justify-center py-3'>
                    <Text className='text-text-secondary text-center text-sm font-medium'>
                      See all
                    </Text>
                  </View>
                </BaseButton>
              </View>
            </View>
          )}
          <TokenHistorySheet
            transactions={tokenHistory}
            token={token}
            wallet={wallet}
            isShowing={showTokenHistorySheet}
            onClose={() => setShowTokenHistorySheet(false)}
            onPressTransaction={onPressTransaction}
          />
        </View>
      ),
    );
  },
  (prev, cur) => prev.token === cur.token && prev.wallet === cur.wallet,
);

interface QuickLinkInfo {
  icon: string;
  label: string;
  link: string;
}

export function TokenQuickLinksPanel(props: { token: ICryptoBalance }) {
  const { token } = props;
  const { address, chainId } = token;

  const getPhotonLink = (
    address: string,
    chainId: number,
  ): QuickLinkInfo | null => {
    if (chainId === ChainId.Solana) {
      return {
        icon: getOriginIcon('https://photon-sol.tinyastro.io'),
        label: 'Photon',
        link: `https://photon-sol.tinyastro.io/en/lp/${address}`,
      };
    } else if (chainId === ChainId.Ethereum) {
      return {
        icon: getOriginIcon('https://photon-sol.tinyastro.io'),
        label: 'Photon',
        link: `https://photon.tinyastro.io/en/lp/${address}`,
      };
    } else if (chainId === ChainId.Base) {
      return {
        icon: getOriginIcon('https://photon-sol.tinyastro.io'),
        label: 'Photon',
        link: `https://photon-base.tinyastro.io/en/lp/${address}`,
      };
    } else if (chainId === ChainId.Blast) {
      return {
        icon: getOriginIcon('https://photon-sol.tinyastro.io'),
        label: 'Photon',
        link: `https://photon-blast.tinyastro.io/en/lp/${address}`,
      };
    } else {
      return null;
    }
  };

  const getBirdEyeLink = (
    address: string,
    chainId: number,
  ): QuickLinkInfo | null => {
    const chainString = birdEyeInverseChainMap[chainId];
    if (!chainString) {
      return null;
    }
    return {
      icon: getOriginIcon('https://birdeye.so'),
      label: 'Birdeye',
      link: `https://birdeye.so/token/${address}?chain=${chainString}`,
    };
  };

  const getDexScreenerLink = (
    address: string,
    chainId: number,
  ): QuickLinkInfo | null => {
    const chainString = dexScreenerInverseChainMap[chainId];
    if (!chainString) {
      return null;
    }
    const link = `https://dexscreener.com/${chainString}/${address}`;
    return {
      icon: getOriginIcon('https://dexscreener.com'),
      label: 'DEX Screener',
      link,
    };
  };

  const quickLinks = [
    getDexScreenerLink(address, chainId),
    getBirdEyeLink(address, chainId),
    getPhotonLink(address, chainId),
  ].filter((quickLink): quickLink is QuickLinkInfo => !!quickLink);

  return (
    quickLinks.length > 0 &&
    !token.tokenMetadata.isNativeToken && (
      <View className='bg-card mx-4 mt-2 flex flex-col rounded-2xl px-4 py-3'>
        <Text className='text-text-primary text-base font-medium'>Links</Text>
        <View className='mt-2 flex flex-row flex-wrap justify-start'>
          {quickLinks.map((quickLink, index) => (
            <BaseButton
              key={index}
              onPress={() => Linking.openURL(quickLink.link)}
            >
              <View className='bg-card-highlight m-1 flex flex-row items-center space-x-2 rounded-xl px-3 py-2'>
                <Image
                  source={{ uri: quickLink.icon }}
                  style={{ ...withSize(adjust(16, 2)), borderRadius: 9999 }}
                />
                <Text className='text-text-primary text-sm font-normal'>
                  {quickLink.label}
                </Text>
              </View>
            </BaseButton>
          ))}
        </View>
      </View>
    )
  );
}
