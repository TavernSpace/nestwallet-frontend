import {
  faArrowUpRightAndArrowDownLeftFromCenter,
  faArrowUpRightFromSquare,
  faBars,
  faBell,
  faClone,
  faGear,
  faLock,
  faRefresh,
  faSidebarFlip,
} from '@fortawesome/pro-light-svg-icons';
import { useState } from 'react';
import { formatAddress } from '../../common/format/address';
import { useCopy } from '../../common/hooks/copy';
import { linkToBlockchainExplorer } from '../../common/hooks/link';
import { adjust } from '../../common/utils/style';
import { IconButton } from '../../components/button/icon-button';
import { Menu } from '../../components/menu';
import { MenuItem } from '../../components/menu/item';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId, onBlockchain } from '../../features/chain';
import {
  IUserAccount,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { WindowType, useNestWallet } from '../../provider/nestwallet';

export function UserMenu(props: {
  userAccount: IUserAccount;
  wallet?: IWallet;
  positionOverride?: number;
  onSettingsPress: VoidFunction;
  onNotificationsPress: VoidFunction;
  onLockPress?: VoidFunction;
  onSyncProposals?: VoidFunction;
  onOpenNewTab?: VoidFunction;
  onOpenSidePanel?: VoidFunction;
}) {
  const {
    userAccount,
    wallet,
    positionOverride,
    onNotificationsPress,
    onSettingsPress,
    onLockPress,
    onSyncProposals,
    onOpenNewTab,
    onOpenSidePanel,
  } = props;
  const { windowType } = useNestWallet();
  const { copy } = useCopy('Copied address!');

  const [showMenu, setShowMenu] = useState(false);

  const iconSize = adjust(20);
  const canOpenDifferentView =
    windowType !== WindowType.tab && windowType !== WindowType.sidepanel;
  const showActionDivider =
    !!wallet || (canOpenDifferentView && (!!onOpenNewTab || !!onOpenSidePanel));

  return (
    <Menu
      visible={showMenu}
      onDismiss={() => setShowMenu(false)}
      anchor={
        <IconButton
          icon={faBars}
          size={iconSize}
          color={colors.textPrimary}
          onPress={() => setShowMenu(true)}
          adornment={
            userAccount.notificationCount > 0 && (
              <View className='absolute right-0 top-0 z-10'>
                <View className='bg-card-highlight h-3 w-3 items-center justify-center rounded-full'>
                  <View className='bg-primary h-2 w-2 rounded-full' />
                </View>
              </View>
            )
          }
        />
      }
      height={200}
      width={200}
      offsets={{ y: iconSize * 1.5, x: iconSize * 1.5 }}
      positionRightOverride={positionOverride}
    >
      <MenuItem
        title='Settings'
        icon={faGear}
        onPress={() => {
          setShowMenu(false);
          onSettingsPress();
        }}
      />
      <MenuItem
        title='Notifications'
        icon={faBell}
        iconAdornment={
          userAccount.notificationCount > 0 && (
            <View className='absolute -right-1 -top-1 z-10'>
              <View className='bg-card-highlight h-3 w-3 items-center justify-center rounded-full'>
                <View className='bg-primary h-2 w-2 rounded-full' />
              </View>
            </View>
          )
        }
        onPress={() => {
          setShowMenu(false);
          onNotificationsPress();
        }}
      />
      {onLockPress && (
        <MenuItem
          title='Lock Wallet'
          icon={faLock}
          onPress={() => {
            setShowMenu(false);
            onLockPress();
          }}
        />
      )}
      {showActionDivider && (
        <View className='h-2 items-center justify-center'>
          <View className='bg-divider h-[1px] w-full' />
        </View>
      )}
      {onOpenNewTab && windowType !== WindowType.tab && (
        <MenuItem
          title='Open in New Tab'
          icon={faArrowUpRightAndArrowDownLeftFromCenter}
          onPress={() => {
            setShowMenu(false);
            onOpenNewTab();
          }}
        />
      )}
      {onOpenSidePanel && canOpenDifferentView && (
        <MenuItem
          title='Open in Sidepanel'
          icon={faSidebarFlip}
          onPress={() => {
            setShowMenu(false);
            onOpenSidePanel();
          }}
        />
      )}
      {wallet && (
        <MenuItem
          title={'Copy Address'}
          subtitle={formatAddress(wallet.address)}
          icon={faClone}
          onPress={() => {
            setShowMenu(false);
            copy(wallet.address);
          }}
        />
      )}
      {wallet && (
        <MenuItem
          title={onBlockchain(wallet.blockchain)(
            () => 'View on Etherscan',
            () => 'View on Solscan',
            () => 'View on Tonviewer',
          )}
          subtitle={formatAddress(wallet.address)}
          icon={faArrowUpRightFromSquare}
          onPress={() => {
            setShowMenu(false);
            linkToBlockchainExplorer(
              onBlockchain(wallet.blockchain)(
                () => wallet.chainId || ChainId.Ethereum,
                () => ChainId.Solana,
                () => ChainId.Ton,
              ),
              {
                type: 'address',
                data: wallet.address,
              },
            );
          }}
        />
      )}
      {onSyncProposals && wallet?.type === IWalletType.Safe && (
        <View className='h-2 items-center justify-center'>
          <View className='bg-divider h-[1px] w-full' />
        </View>
      )}
      {onSyncProposals && wallet?.type === IWalletType.Safe && (
        <MenuItem
          title={'Sync Proposals'}
          subtitle={'Fetch proposals made externally.'}
          icon={faRefresh}
          onPress={() => {
            setShowMenu(false);
            onSyncProposals();
          }}
        />
      )}
    </Menu>
  );
}
