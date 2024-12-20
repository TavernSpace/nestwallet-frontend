import { faChevronDown } from '@fortawesome/pro-regular-svg-icons';
import { faCircleInfo } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Platform } from 'react-native';
import { ConnectedSite, ISignerWallet } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { convertWalletTypeToLabel } from '../../../common/utils/types';
import { InfoSheet } from '../../../components/alert/info';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { Banner } from '../../../components/banner';
import { BaseButton } from '../../../components/button/base-button';
import { ConnectionIcon } from '../../../components/connection';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ScanBorder } from '../../../components/scan';
import { ActionSheet } from '../../../components/sheet';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { SCREEN_WIDTH, colors } from '../../../design/constants';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { isHardwareWallet } from '../../../features/wallet/utils';
import {
  IBlockchainType,
  IUser,
  IUserAccount,
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { ScanTonConnectQRCode } from '../../../molecules/scan/tonconnect';
import { ScanWalletConnectQRCode } from '../../../molecules/scan/walletconnect';
import { UserMenu } from '../menu';

export function hasWalletBanner(wallet: ISignerWallet) {
  const hasViewOnlyBanner =
    (wallet.type === IWalletType.SeedPhrase ||
      wallet.type === IWalletType.PrivateKey) &&
    !wallet.hasKeyring;
  const hasHardwareViewOnlyBanner =
    isHardwareWallet(wallet) && Platform.OS !== 'web';
  const hasDeploymentBanner =
    wallet.deploymentStatus !== IWalletDeploymentStatus.Deployed;
  const hasProposalBanner = wallet.proposalCount > 0 && !hasDeploymentBanner;
  return {
    hasProposalBanner,
    hasViewOnlyBanner,
    hasHardwareViewOnlyBanner,
    hasDeploymentBanner,
    bannerCount:
      (hasProposalBanner ? 1 : 0) +
      (hasViewOnlyBanner ? 1 : 0) +
      (hasHardwareViewOnlyBanner ? 1 : 0) +
      (hasDeploymentBanner ? 1 : 0),
  };
}

export function WalletHeader(props: {
  user: IUser;
  wallet: ISignerWallet;
  userAccount: IUserAccount;
  onSelectWallet: VoidFunction;
  onNotificationPress: VoidFunction;
  onSettingsPress: VoidFunction;
  connectedSite?: ConnectedSite;
  onConnectedSitePress?: VoidFunction;
  onProposalsPress?: VoidFunction;
  onSyncProposals?: VoidFunction;
  onActivateSafe?: VoidFunction;
  onOpenNewTab?: VoidFunction;
  onOpenSidePanel?: VoidFunction;
  onLock?: VoidFunction;
  onReimportWalletPress?: (wallet: IWallet) => void;
  onQRCodeScan?: (data: string) => Promise<void>;
}) {
  const {
    user,
    wallet,
    userAccount,
    onSelectWallet,
    onNotificationPress,
    onSettingsPress,
    connectedSite,
    onConnectedSitePress,
    onProposalsPress,
    onSyncProposals,
    onActivateSafe,
    onOpenNewTab,
    onOpenSidePanel,
    onLock,
    onReimportWalletPress,
    onQRCodeScan,
  } = props;
  const { top } = useSafeAreaInsets();

  const [showSheetType, setShowSheetType] = useState<
    'import' | 'sync' | 'activate' | 'hardware'
  >();
  const [showScanSheet, setShowScanSheet] = useState(false);

  const {
    hasDeploymentBanner,
    hasHardwareViewOnlyBanner,
    hasProposalBanner,
    hasViewOnlyBanner,
  } = hasWalletBanner(wallet);

  const isConnected =
    !!connectedSite &&
    Object.keys(connectedSite.connections).length > 0 &&
    !!connectedSite.siteInfo;

  return (
    <View
      className='flex w-full flex-col space-y-2 px-4'
      style={{
        paddingTop: Math.max(16, top),
      }}
    >
      <View className='flex w-full flex-row items-start justify-between'>
        {Platform.OS === 'web' ? (
          <ConnectionIcon
            isConnected={isConnected}
            iconUrl={connectedSite?.siteInfo?.imageUrl}
            onPress={onConnectedSitePress}
          />
        ) : (
          <BaseButton
            className='mr-1'
            pressableStyle={{ borderRadius: 8 }}
            scale={0.9}
            onPress={() => {
              setShowScanSheet(true);
            }}
            style={{ borderRadius: 8 }}
          >
            <View
              className='items-center justify-center'
              style={withSize(adjust(30))}
            >
              <ScanBorder
                size={adjust(18, 2)}
                length={7}
                thickness={Platform.OS === 'android' ? 2 : 4}
                color={colors.textPrimary}
                radius={Platform.OS === 'android' ? 4 : 12}
              />
            </View>
          </BaseButton>
        )}
        <View className='flex flex-row items-center space-x-3 rounded-2xl'>
          <BaseButton onPress={onSelectWallet}>
            <WalletAvatar wallet={wallet} size={adjust(28)} />
          </BaseButton>
          <View className='flex flex-col'>
            <BaseButton onPress={onSelectWallet}>
              <View className='flex flex-row items-center space-x-1'>
                <View
                  style={{
                    maxWidth: Math.floor(SCREEN_WIDTH * 0.4),
                  }}
                >
                  <Text
                    className='text-text-primary truncate text-base font-medium'
                    numberOfLines={1}
                  >
                    {wallet.name}
                  </Text>
                </View>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  size={adjust(12, 2)}
                  color={colors.textPrimary}
                />
              </View>
            </BaseButton>
          </View>
        </View>
        <View className='-mr-1 flex flex-row items-center justify-end space-x-1.5'>
          <UserMenu
            userAccount={userAccount}
            wallet={wallet}
            onSettingsPress={onSettingsPress}
            onNotificationsPress={onNotificationPress}
            onLockPress={onLock}
            onOpenNewTab={onOpenNewTab}
            onOpenSidePanel={onOpenSidePanel}
            onSyncProposals={onSyncProposals}
          />
        </View>
      </View>
      {hasProposalBanner && (
        <Banner
          title={`${wallet.proposalCount} pending proposal${
            wallet.proposalCount === 1 ? '' : 's'
          }`}
          icon={faCircleInfo}
          color={colors.primary}
          onPress={onProposalsPress}
        />
      )}
      {hasViewOnlyBanner && (
        <Banner
          title='View only wallet'
          icon={faCircleInfo}
          color={colors.infoNeutral}
          onPress={() => setShowSheetType('import')}
        />
      )}
      {hasHardwareViewOnlyBanner && (
        <Banner
          title={`${convertWalletTypeToLabel(wallet.type)}: View Only`}
          icon={faCircleInfo}
          color={colors.infoNeutral}
          onPress={() => setShowSheetType('hardware')}
        />
      )}
      {hasDeploymentBanner && (
        <Banner
          title={
            wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
              ? 'Inactive Safe'
              : 'Deploying Safe'
          }
          icon={
            wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
              ? faCircleInfo
              : 'loading'
          }
          color={colors.info}
          onPress={() => setShowSheetType('activate')}
        />
      )}
      {onReimportWalletPress && (
        <InfoSheet
          title='View Only Wallet'
          body={`This wallet was imported on another device. You won't be able to sign transactions on this device unless you import the seed phrase or private key on this device as well.`}
          isShowing={showSheetType === 'import'}
          onClose={() => setShowSheetType(undefined)}
          buttonText='Reimport'
          onPress={() => {
            onReimportWalletPress(wallet);
          }}
        />
      )}
      {Platform.OS !== 'web' && (
        <InfoSheet
          title='View Only'
          body={`This is a hardware wallet. You can view your balances but can't make any transactions on your mobile device.`}
          isShowing={showSheetType === 'hardware'}
          onClose={() => setShowSheetType(undefined)}
        />
      )}
      <InfoSheet
        title={
          wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
            ? 'Activate your Safe'
            : 'Deploying Safe'
        }
        body={
          wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
            ? 'Your Safe has been imported but has not been deployed on chain yet. ' +
              'You can receive assets on your Safe, but cannot send assets or ' +
              'interact with Dapps until you activate your Safe. Safes are ' +
              'smart-contract wallets so must be deployed through a transaction.'
            : 'Your Safe is currently being created and indexed. This could take a few minutes.'
        }
        isShowing={showSheetType === 'activate'}
        onClose={() => setShowSheetType(undefined)}
        buttonText='Activate'
        onPress={
          wallet.deploymentStatus === IWalletDeploymentStatus.Undeployed
            ? onActivateSafe
            : undefined
        }
      />
      {onQRCodeScan && (
        <ActionSheet
          isShowing={showScanSheet}
          onClose={() => setShowScanSheet(false)}
          isFullHeight={true}
          hasTopInset={true}
          hasBottomInset={false}
        >
          {wallet.blockchain === IBlockchainType.Tvm ? (
            <ScanTonConnectQRCode
              onBack={() => setShowScanSheet(false)}
              onScan={async (data) => {
                await onQRCodeScan(data);
                setShowScanSheet(false);
              }}
            />
          ) : (
            <ScanWalletConnectQRCode
              onBack={() => setShowScanSheet(false)}
              onScan={async (data) => {
                await onQRCodeScan(data);
                setShowScanSheet(false);
              }}
            />
          )}
        </ActionSheet>
      )}
    </View>
  );
}
