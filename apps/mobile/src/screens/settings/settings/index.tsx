import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import {
  loadDataFromQuery,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { SettingsScreen } from '@nestwallet/app/screens/settings/settings';
import { SecretType } from '@nestwallet/app/screens/signer/reveal-key/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { usePreferencesQuery, useWalletById } from '../../../hooks/wallet';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useAuthContext } from '../../../provider/auth';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<SettingsStackParamList, 'index'>;

export const SettingsWithData = withUserContext(_SettingsWithData);

function _SettingsWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { userService } = useAppContext();
  const { user, signers } = useUserContext();
  const { logout } = useAuthContext();
  const navigation = useNavigation();
  const resetTo = useResetTo();

  const signerWallet = wallet
    ? signers.find((signer) => signer.id === wallet.id) || {
        ...wallet,
        hasKeyring: false,
      }
    : undefined;

  const preferencesQuery = usePreferencesQuery();
  const preferences = loadDataFromQuery(preferencesQuery);

  const handleUserProfilePressed = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'editProfile',
      },
    });
  };

  const handleContactBookPressed = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'contacts',
      },
    });
  };

  const handlePromoCodePressed = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'promocode',
      },
    });
  };

  const handleNotificationSettingsPressed = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'notificationSettings',
      },
    });
  };

  const handleSignOut = async () => {
    await logout();
    resetTo('auth');
  };

  const handleSigners = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'editWalletSigners',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleBackupWallet = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'backupWallet',
      },
    });
  };

  const handleEditWallet = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'editWallet',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleDeriveMoreWallets = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'deriveMoreWallets',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleMultichainDeploy = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'multichainDeployChain',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleRevealSecret = (wallet: IWallet, secretType: SecretType) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'revealKeyWarning',
        params: {
          walletId: wallet.id,
          secretType,
        },
      },
    });
  };

  const handleCloseTokenAccounts = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'closeEmptyTokenAccounts',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleWalletVersion = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'walletVersion',
        params: {
          walletId: wallet.id,
        },
      },
    });
  };

  const handleAudioToggle = async () => {
    if (preferences.success) {
      userService.setPreferences({
        ...preferences.data,
        audioMuted: !preferences.data.audioMuted,
      });
      await preferencesQuery.refetch();
    }
  };

  const handleTransactionWidgetToggle = async () => {
    if (preferences.success) {
      userService.setPreferences({
        ...preferences.data,
        showTransactionWidget: !preferences.data.showTransactionWidget,
      });
      await preferencesQuery.refetch();
    }
  };

  const handleAutoLockTimerSet = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'setAutoLockTimer',
      },
    });
  };

  const handleLanguagePressed = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'setLanguage',
      },
    });
  };

  return onLoadable(preferences)(
    () => null,
    // TODO: handle error
    () => null,
    (preferences) => (
      <SettingsScreen
        user={user}
        preferences={preferences}
        wallet={signerWallet}
        onBackupPressed={handleBackupWallet}
        onProfilePressed={handleUserProfilePressed}
        onContactBookPressed={handleContactBookPressed}
        onPromoCodePressed={handlePromoCodePressed}
        onNotificationSettingsPressed={handleNotificationSettingsPressed}
        onSignOut={handleSignOut}
        onEditSignersPressed={handleSigners}
        onEditWalletPressed={handleEditWallet}
        onDeriveMoreWalletsPressed={handleDeriveMoreWallets}
        onMultichainDeployPressed={handleMultichainDeploy}
        onRevealSecretPressed={handleRevealSecret}
        onCloseEmptyTokenAccountsPressed={handleCloseTokenAccounts}
        onAudioToggle={handleAudioToggle}
        onTransactionWidgetToggle={handleTransactionWidgetToggle}
        onAutoLockTimerPressed={handleAutoLockTimerSet}
        onLanguagePressed={handleLanguagePressed}
        onWalletVersionPressed={handleWalletVersion}
      />
    ),
  );
}
