import {
  faChartLine,
  faChartMixedUpCircleDollar,
  faEllipsisV,
  faEye,
  faEyeSlash,
  faFilter,
  faGrid2,
  faListCheck,
  faListUl,
  faRefresh,
} from '@fortawesome/pro-light-svg-icons';
import { styled } from 'nativewind';
import { useState } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { Loadable, Preferences } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { ActivityIndicator } from '../../../components/activity-indicator';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { IconButton } from '../../../components/button/icon-button';
import { Menu } from '../../../components/menu';
import { MenuItem } from '../../../components/menu/item';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { getChainInfo } from '../../../features/chain';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { NFTDisplay } from '../collections/types';

export const WalletHomeMenu = styled(function (props: {
  wallet: IWallet;
  filter: number;
  preferences: Loadable<Preferences>;
  nftView?: NFTDisplay;
  refreshingTokens?: boolean;
  refreshingNFTs?: boolean;
  refreshingOrders?: boolean;
  onChangePreferences: (preferences: Preferences) => void;
  onFilterPress: VoidFunction;
  onChangeNFTView?: (view: NFTDisplay) => void;
  onManageTokensPress?: VoidFunction;
  onManageNFTsPress?: VoidFunction;
  onRefreshTokens?: VoidFunction;
  onRefreshNFTs?: VoidFunction;
  onRefreshOrders?: VoidFunction;
  style?: StyleProp<ViewStyle>;
  anchorStyle?: StyleProp<ViewStyle>;
}) {
  const {
    wallet,
    filter,
    nftView,
    preferences,
    refreshingNFTs,
    refreshingTokens,
    refreshingOrders,
    onChangePreferences,
    onFilterPress,
    onChangeNFTView,
    onManageNFTsPress,
    onManageTokensPress,
    onRefreshNFTs,
    onRefreshTokens,
    onRefreshOrders,
    style,
    anchorStyle,
  } = props;

  const [showMenu, setShowMenu] = useState(false);

  return (
    <View className='flex flex-row items-center space-x-1' style={style}>
      {filter !== 0 && (
        <View className='-mt-1'>
          <BaseButton onPress={() => onFilterPress()}>
            <ChainAvatar
              chainInfo={getChainInfo(filter)}
              shape='square'
              size={adjust(22, 2)}
            />
          </BaseButton>
        </View>
      )}
      <Menu
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        anchor={
          <IconButton
            color={colors.textSecondary}
            icon={faEllipsisV}
            onPress={() => setShowMenu(true)}
            disableHover
            size={adjust(22)}
          />
        }
        anchorStyle={anchorStyle}
        height={200}
        width={Platform.OS === 'web' ? 200 : 210}
      >
        {preferences.success && (
          <MenuItem
            title={
              preferences.data.profitLoss === 'daily'
                ? 'Display PNL'
                : 'Display Daily Change'
            }
            icon={
              preferences.data.profitLoss === 'daily'
                ? faChartMixedUpCircleDollar
                : faChartLine
            }
            onPress={() => {
              setShowMenu(false);
              onChangePreferences({
                ...preferences.data,
                profitLoss:
                  preferences.data.profitLoss === 'daily' ? 'pnl' : 'daily',
              });
            }}
          />
        )}
        {preferences.success && (
          <MenuItem
            title={`${
              preferences.data.stealthMode ? 'Exit' : 'Enter'
            } Stealth Mode`}
            icon={preferences.data.stealthMode ? faEye : faEyeSlash}
            onPress={() => {
              setShowMenu(false);
              onChangePreferences({
                ...preferences.data,
                stealthMode: !preferences.data.stealthMode,
              });
            }}
          />
        )}
        {wallet.type !== IWalletType.Safe &&
          wallet.blockchain === IBlockchainType.Evm && (
            <MenuItem
              title={'Filter Network'}
              icon={faFilter}
              iconReplacement={
                filter !== 0 ? (
                  <View className='-ml-0.5'>
                    <ChainAvatar
                      chainInfo={getChainInfo(filter)}
                      size={adjust(18, 2)}
                    />
                  </View>
                ) : undefined
              }
              onPress={() => {
                setShowMenu(false);
                onFilterPress();
              }}
            />
          )}
        {!!nftView && !!onChangeNFTView && (
          <MenuItem
            title={nftView === 'grid' ? 'Use List View' : 'Use Grid View'}
            icon={nftView === 'grid' ? faListUl : faGrid2}
            onPress={() => {
              setShowMenu(false);
              onChangeNFTView(nftView === 'grid' ? 'list' : 'grid');
            }}
          />
        )}
        {onManageNFTsPress && (
          <MenuItem
            title={'Manage NFTs'}
            icon={faListCheck}
            onPress={() => {
              setShowMenu(false);
              onManageNFTsPress();
            }}
          />
        )}
        {onManageTokensPress && (
          <MenuItem
            title={'Manage Tokens'}
            icon={faListCheck}
            onPress={() => {
              setShowMenu(false);
              onManageTokensPress();
            }}
          />
        )}
        <View className='h-2 items-center justify-center'>
          <View className='bg-divider h-[1px] w-full' />
        </View>
        {refreshingNFTs !== undefined && !!onRefreshNFTs && (
          <MenuItem
            title={'Refresh NFTs'}
            icon={faRefresh}
            iconReplacement={
              refreshingNFTs ? (
                <ActivityIndicator
                  color={colors.textPrimary}
                  size={adjust(14, 2)}
                />
              ) : undefined
            }
            onPress={() => {
              setShowMenu(false);
              onRefreshNFTs();
            }}
          />
        )}
        {refreshingTokens !== undefined && !!onRefreshTokens && (
          <MenuItem
            title={'Refresh Tokens'}
            icon={faRefresh}
            iconReplacement={
              refreshingTokens ? (
                <ActivityIndicator
                  color={colors.textPrimary}
                  size={adjust(14, 2)}
                />
              ) : undefined
            }
            onPress={() => {
              setShowMenu(false);
              onRefreshTokens();
            }}
          />
        )}
        {refreshingOrders !== undefined && !!onRefreshOrders && (
          <MenuItem
            title={'Refresh Orders'}
            icon={faRefresh}
            iconReplacement={
              refreshingTokens ? (
                <ActivityIndicator
                  color={colors.textPrimary}
                  size={adjust(14, 2)}
                />
              ) : undefined
            }
            onPress={() => {
              setShowMenu(false);
              onRefreshOrders();
            }}
          />
        )}
      </Menu>
    </View>
  );
});
