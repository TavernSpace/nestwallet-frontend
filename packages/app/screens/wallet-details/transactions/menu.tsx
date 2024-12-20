import {
  faEllipsisV,
  faEye,
  faEyeSlash,
  faFilter,
  faRefresh,
} from '@fortawesome/pro-light-svg-icons';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
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

export const WalletTransactionMenu = styled(function (props: {
  wallet: IWallet;
  filter: number;
  hideSpam: boolean;
  refreshing: boolean;
  offsetX: number;
  onFilterPress: VoidFunction;
  onSpamPress: VoidFunction;
  onRefresh: VoidFunction;
  style?: StyleProp<ViewStyle>;
  anchorStyle?: StyleProp<ViewStyle>;
}) {
  const {
    wallet,
    filter,
    hideSpam,
    offsetX,
    refreshing,
    onFilterPress,
    onRefresh,
    onSpamPress,
    style,
    anchorStyle,
  } = props;

  const [showMenu, setShowMenu] = useState(false);

  return (
    <View className='flex flex-row items-center' style={style}>
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
        height={120}
        width={200}
        offsets={{ x: offsetX, y: 0 }}
      >
        <MenuItem
          title={`${hideSpam ? 'Show' : 'Hide'} Spam`}
          icon={hideSpam ? faEye : faEyeSlash}
          onPress={() => {
            setShowMenu(false);
            onSpamPress();
          }}
        />
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
        <View className='h-2 items-center justify-center'>
          <View className='bg-divider h-[1px] w-full' />
        </View>
        <MenuItem
          title={'Refresh History'}
          icon={faRefresh}
          iconReplacement={
            refreshing ? (
              <ActivityIndicator
                color={colors.textPrimary}
                size={adjust(14, 2)}
              />
            ) : undefined
          }
          onPress={() => {
            setShowMenu(false);
            onRefresh();
          }}
        />
      </Menu>
    </View>
  );
});
