import { faArrowRightFromBracket } from '@fortawesome/pro-regular-svg-icons';
import {
  faAddressBook,
  faAlarmClock,
  faBell,
  faCloud,
  faCodeFork,
  faGiftCard,
  faKeySkeleton,
  faLanguage,
  faLayerGroup,
  faLinkHorizontal,
  faLock,
  faPiggyBank,
  faSeedling,
  faSidebarFlip,
  faSquareCode,
  faUser,
  faUsers,
  faVolume,
  faWallet,
} from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { Platform } from 'react-native';
import {
  ISignerWallet,
  Loadable,
  Preferences,
  VoidPromiseFunction,
} from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { UserAvatar } from '../../../components/avatar/user-avatar';
import { IconButton } from '../../../components/button/icon-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItemWithRightAngle } from '../../../components/list/list-item';
import { ScrollView } from '../../../components/scroll';
import { ActionSheet } from '../../../components/sheet';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Switch } from '../../../components/switch';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { defaultTvmSinglePath } from '../../../features/wallet/seedphrase';
import {
  IBlockchainType,
  IUser,
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { SecretType } from '../../signer/reveal-key/types';
import { localization } from './localization';

interface SettingsProps {
  // device settings
  user: IUser;
  preferences: Preferences;
  defaultSidepanel?: Loadable<boolean>;
  onProfilePressed: VoidFunction;
  onContactBookPressed: VoidFunction;
  onPromoCodePressed: VoidFunction;
  onNotificationSettingsPressed?: VoidFunction;
  onBackupPressed?: VoidFunction;
  onPasswordChangedPressed?: VoidFunction;
  onSignOut: VoidPromiseFunction;
  onAudioToggle: VoidPromiseFunction;
  onTransactionWidgetToggle: VoidPromiseFunction;
  onDisplayToggle?: VoidPromiseFunction;
  onAutoLockTimerPressed: VoidFunction;
  onLanguagePressed: VoidFunction;

  // wallet settings
  wallet?: ISignerWallet;
  onEditSignersPressed: (wallet: IWallet) => void;
  onEditWalletPressed: (wallet: IWallet) => void;
  onDeriveMoreWalletsPressed: (wallet: IWallet) => void;
  onMultichainDeployPressed: (wallet: IWallet) => void;
  onRevealSecretPressed: (wallet: IWallet, secretType: SecretType) => void;
  onCloseEmptyTokenAccountsPressed: (wallet: IWallet) => void;
  onWalletVersionPressed: (wallet: IWallet) => void;
}

export function SettingsScreen(props: SettingsProps) {
  const {
    user,
    wallet,
    preferences,
    defaultSidepanel,
    onProfilePressed,
    onContactBookPressed,
    onPromoCodePressed,
    onNotificationSettingsPressed,
    onBackupPressed,
    onPasswordChangedPressed,
    onSignOut,
    onEditSignersPressed,
    onEditWalletPressed,
    onDeriveMoreWalletsPressed,
    onMultichainDeployPressed,
    onRevealSecretPressed,
    onDisplayToggle,
    onAudioToggle,
    onTransactionWidgetToggle,
    onAutoLockTimerPressed,
    onLanguagePressed,
    onCloseEmptyTokenAccountsPressed,
    onWalletVersionPressed,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();
  const { bottom } = useSafeAreaInsets();

  const [showSignOutSheet, setShowSignOutSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [transactionWidgetLoading, setTransactionWidgetLoading] =
    useState(false);
  const [displayLoading, setDisplayLoading] = useState(false);

  const computeWalletStatus = (wallet?: ISignerWallet) => {
    if (wallet) {
      const isSafe = wallet.type === IWalletType.Safe;
      const isSolana = wallet.blockchain === IBlockchainType.Svm;
      const isTon = wallet.blockchain === IBlockchainType.Tvm;
      const isPrivateKey = wallet.type === IWalletType.PrivateKey;
      const isSeedPhrase = wallet.type === IWalletType.SeedPhrase;
      const isLedger = wallet.type === IWalletType.Ledger;
      const hasSecret = wallet.hasKeyring && (isPrivateKey || isSeedPhrase);

      const isSafeDeployed =
        wallet.deploymentStatus === IWalletDeploymentStatus.Deployed;
      return { isSafe, isSafeDeployed, hasSecret, isSolana, isTon, isLedger };
    } else {
      return {};
    }
  };

  const handleSignOut = async () => {
    try {
      setIsSubmitting(true);
      await onSignOut();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successfullyLoggedOut[language],
      });
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorLoggingOut[language],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAudio = async () => {
    try {
      setAudioLoading(true);
      await onAudioToggle();
    } catch {
      // TODO: should we show an error here?
    } finally {
      setAudioLoading(false);
    }
  };

  const handleToggleTransactionWidget = async () => {
    try {
      setTransactionWidgetLoading(true);
      await onAudioToggle();
    } catch {
      // TODO: should we show an error here?
    } finally {
      setTransactionWidgetLoading(false);
    }
  };

  const handleToggleDisplay = async () => {
    try {
      setDisplayLoading(true);
      await onDisplayToggle?.();
    } catch {
      // TODO: should we show an error here?
    } finally {
      setDisplayLoading(false);
    }
  };

  const { isSafe, isSafeDeployed, hasSecret, isSolana, isTon, isLedger } =
    computeWalletStatus(wallet);
  const iconSize = adjust(16);
  const defaultName =
    Platform.OS === 'web'
      ? localization.myBrowser[language]
      : localization.myPhone[language];

  return (
    <View className='absolute h-full w-full'>
      <View className='flex flex-row items-center justify-between px-4'>
        <View className='flex flex-1 flex-row items-center space-x-2'>
          <UserAvatar user={user} size={adjust(36)} />
          <View className='flex flex-1 flex-col'>
            <Text className='text-text-primary text-md font-medium'>
              {localization.loggedInAs[language]}
            </Text>
            <Text
              className='text-text-secondary truncate text-sm font-normal'
              numberOfLines={1}
            >
              {user.email ?? user.name ?? defaultName}
            </Text>
          </View>
        </View>
        <IconButton
          icon={faArrowRightFromBracket}
          size={adjust(20, 2)}
          color={colors.failure}
          onPress={() => setShowSignOutSheet(true)}
        />
      </View>

      <View className='w-full px-4 py-4'>
        <View className='bg-card h-[1px]' />
      </View>

      <ScrollView
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottom }}
      >
        {wallet && (
          <View className='mx-4 mb-4 space-y-2'>
            <Text className='text-text-secondary text-sm font-medium'>
              {localization.wallet[language]}
            </Text>
            <View className='bg-card overflow-hidden rounded-2xl'>
              <View className='flex flex-col'>
                <ListItemWithRightAngle
                  onPress={() => onEditWalletPressed(wallet)}
                >
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faWallet}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.editWallet[language]}
                    </Text>
                  </View>
                </ListItemWithRightAngle>

                {isSafe && isSafeDeployed && (
                  <ListItemWithRightAngle
                    onPress={() => onEditSignersPressed(wallet)}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faUsers}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.signers[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {wallet.type === IWalletType.SeedPhrase &&
                  wallet.derivationPath !== defaultTvmSinglePath &&
                  wallet.hasKeyring && (
                    <ListItemWithRightAngle
                      onPress={() => onDeriveMoreWalletsPressed(wallet)}
                    >
                      <View className='flex flex-row items-center space-x-4'>
                        <FontAwesomeIcon
                          icon={faLayerGroup}
                          size={iconSize}
                          color={colors.textSecondary}
                        />
                        <Text className='text-text-primary text-sm font-medium'>
                          {localization.deriveMoreWallets[language]}
                        </Text>
                      </View>
                    </ListItemWithRightAngle>
                  )}

                {isSafe && isSafeDeployed && (
                  <ListItemWithRightAngle
                    onPress={() => onMultichainDeployPressed(wallet)}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faLinkHorizontal}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.multichainDeploy[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {hasSecret && wallet.type === IWalletType.SeedPhrase && (
                  <ListItemWithRightAngle
                    onPress={() => onRevealSecretPressed(wallet, 'seed')}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faSeedling}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.revealSeedPhrase[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {hasSecret && (
                  <ListItemWithRightAngle
                    onPress={() => onRevealSecretPressed(wallet, 'pk')}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faKeySkeleton}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.revealPrivateKey[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {(hasSecret || isLedger) && isSolana && (
                  <ListItemWithRightAngle
                    onPress={() => onCloseEmptyTokenAccountsPressed(wallet)}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faPiggyBank}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.emptyTokenAccounts[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {hasSecret && isTon && (
                  <ListItemWithRightAngle
                    onPress={() => onWalletVersionPressed(wallet)}
                  >
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faCodeFork}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.walletVersions[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}

                {onBackupPressed && !!user.email && (
                  <ListItemWithRightAngle onPress={onBackupPressed}>
                    <View className='flex flex-row items-center space-x-4'>
                      <FontAwesomeIcon
                        icon={faCloud}
                        size={iconSize}
                        color={colors.textSecondary}
                      />
                      <Text className='text-text-primary text-sm font-medium'>
                        {localization.backupWallets[language]}
                      </Text>
                    </View>
                  </ListItemWithRightAngle>
                )}
              </View>
            </View>
          </View>
        )}

        <View className='mx-4 mb-4 space-y-2'>
          <Text className='text-text-secondary text-sm font-medium'>
            {localization.user[language]}
          </Text>
          <View className='bg-card overflow-hidden rounded-2xl'>
            <View className='flex flex-col'>
              <ListItemWithRightAngle onPress={onProfilePressed}>
                <View className='flex flex-row items-center space-x-4'>
                  <FontAwesomeIcon
                    icon={faUser}
                    size={iconSize}
                    color={colors.textSecondary}
                  />
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.editProfile[language]}
                  </Text>
                </View>
              </ListItemWithRightAngle>
              <ListItemWithRightAngle onPress={onContactBookPressed}>
                <View className='flex flex-row items-center space-x-4'>
                  <FontAwesomeIcon
                    icon={faAddressBook}
                    size={iconSize}
                    color={colors.textSecondary}
                  />
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.contacts[language]}
                  </Text>
                </View>
              </ListItemWithRightAngle>
              <ListItemWithRightAngle onPress={onPromoCodePressed}>
                <View className='flex flex-row items-center space-x-4'>
                  <FontAwesomeIcon
                    icon={faGiftCard}
                    size={iconSize}
                    color={colors.textSecondary}
                  />
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.promotions[language]}
                  </Text>
                </View>
              </ListItemWithRightAngle>
              <ListItemWithRightAngle onPress={onLanguagePressed}>
                <View className='flex flex-row items-center space-x-4'>
                  <FontAwesomeIcon
                    icon={faLanguage}
                    size={iconSize}
                    color={colors.textSecondary}
                  />
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.language[language]}
                  </Text>
                </View>
              </ListItemWithRightAngle>
              {onNotificationSettingsPressed && (
                <ListItemWithRightAngle onPress={onNotificationSettingsPressed}>
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faBell}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.notifications[language]}
                    </Text>
                  </View>
                </ListItemWithRightAngle>
              )}
            </View>
          </View>
        </View>

        <View className='mx-4 space-y-2'>
          <Text className='text-text-secondary text-sm font-medium'>
            {localization.device[language]}
          </Text>
          <View className='bg-card overflow-hidden rounded-2xl'>
            <View className='flex flex-col'>
              {onPasswordChangedPressed && (
                <ListItemWithRightAngle onPress={onPasswordChangedPressed}>
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faLock}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.changePassword[language]}
                    </Text>
                  </View>
                </ListItemWithRightAngle>
              )}
              {onAutoLockTimerPressed && (
                <ListItemWithRightAngle onPress={onAutoLockTimerPressed}>
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faAlarmClock}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.autoLockTimer[language]}
                    </Text>
                  </View>
                </ListItemWithRightAngle>
              )}
              <View className='flex flex-row items-center justify-between px-4 py-4'>
                <View className='flex flex-row items-center space-x-4'>
                  <FontAwesomeIcon
                    icon={faVolume}
                    size={iconSize}
                    color={colors.textSecondary}
                  />
                  <Text className='text-text-primary text-sm font-medium'>
                    {localization.audio[language]}
                  </Text>
                </View>
                <Switch
                  value={!preferences.audioMuted}
                  onChange={handleToggleAudio}
                  disabled={audioLoading}
                />
              </View>
              {onDisplayToggle && defaultSidepanel?.success && (
                <View className='flex flex-row items-center justify-between px-4 py-4'>
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faSidebarFlip}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.defaultSidepanel[language]}
                    </Text>
                  </View>
                  <Switch
                    value={defaultSidepanel.data}
                    onChange={handleToggleDisplay}
                    disabled={displayLoading}
                  />
                </View>
              )}
              {false && (
                <View className='flex flex-row items-center justify-between px-4 py-4'>
                  <View className='flex flex-row items-center space-x-4'>
                    <FontAwesomeIcon
                      icon={faSquareCode}
                      size={iconSize}
                      color={colors.textSecondary}
                    />
                    <Text className='text-text-primary text-sm font-medium'>
                      {localization.transactionTracker[language]}
                    </Text>
                  </View>
                  <Switch
                    value={preferences.showTransactionWidget}
                    onChange={handleToggleTransactionWidget}
                    disabled={transactionWidgetLoading}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
      <ActionSheet
        isShowing={showSignOutSheet}
        onClose={() => setShowSignOutSheet(false)}
        isDetached={true}
      >
        <ActionSheetHeader
          title={localization.logOutQuestion[language]}
          onClose={() => setShowSignOutSheet(false)}
          type='detached'
        />
        <View className='flex flex-col space-y-4 px-4'>
          <Text className='text-text-secondary text-sm font-normal'>
            {localization.logOutConfirmation[language]}
          </Text>
          <View className='flex w-full flex-row space-x-4'>
            <View className='flex-1'>
              <TextButton
                text={localization.cancel[language]}
                type='tertiary'
                disabled={isSubmitting}
                onPress={() => setShowSignOutSheet(false)}
              />
            </View>
            <View className='flex-1'>
              <TextButton
                text={localization.logOut[language]}
                onPress={handleSignOut}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </View>
      </ActionSheet>
    </View>
  );
}
