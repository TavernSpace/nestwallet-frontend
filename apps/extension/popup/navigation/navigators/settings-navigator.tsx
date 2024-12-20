import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { PasswordChangedWithData } from '../../screens/settings/change-password';
import { CloseEmptyTokenAccounts } from '../../screens/settings/close-token-accounts';
import { ContactsWithData } from '../../screens/settings/contacts';
import { UpsertContactWithData } from '../../screens/settings/contacts/upsert-contact';
import { DeriveMoreWalletsWithData } from '../../screens/settings/derive-more-wallets';
import { EditProfileWithData } from '../../screens/settings/edit-profile';
import { UpdateEmailWithData } from '../../screens/settings/edit-profile/update-email';
import { UpdateEmailCodeWithData } from '../../screens/settings/edit-profile/update-email-code';
import { EditWalletWithData } from '../../screens/settings/edit-wallet';
import { EditWalletSignersWithData } from '../../screens/settings/edit-wallet-signers';
import { MultichainDeployChainScreenWithData } from '../../screens/settings/multichain-deploy/chain';
import { MultichainDeployExecuteScreenWithData } from '../../screens/settings/multichain-deploy/execute';
import { NotificationSettingsWithData } from '../../screens/settings/notification-settings';
import { PromoCodeWithData } from '../../screens/settings/promo-code';
import { RevealKeyWithData } from '../../screens/settings/reveal-key';
import { RevealKeyWarningWithData } from '../../screens/settings/reveal-key-warning';
import { AutoLockTimerWithData } from '../../screens/settings/set-auto-lock-timer';
import { LanguageWithData } from '../../screens/settings/set-language';
import { SetPassword } from '../../screens/settings/set-password';
import { SettingsWithData } from '../../screens/settings/settings';
import { WalletVersion } from '../../screens/settings/wallet-version';
import { AppStackParamList, SettingsStack } from '../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from './options';

type RouteProps = StackScreenProps<AppStackParamList, 'settings'>;

export function SettingsNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <SettingsStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <SettingsStack.Screen
          name='index'
          component={SettingsWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerLeft: () => null,
          })}
        />
        <SettingsStack.Screen
          name='editProfile'
          component={EditProfileWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Edit Profile',
          })}
        />
        <SettingsStack.Screen
          name='updateEmail'
          component={UpdateEmailWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Change Email',
          })}
        />
        <SettingsStack.Screen
          name='updateEmailCode'
          component={UpdateEmailCodeWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Verify Code',
          })}
        />
        <SettingsStack.Screen
          name='contacts'
          component={ContactsWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Contacts',
          })}
        />
        <SettingsStack.Screen
          name='upsertContact'
          component={UpsertContactWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Contact',
          })}
        />
        <SettingsStack.Screen
          name='promocode'
          component={PromoCodeWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Promotions',
          })}
        />
        <SettingsStack.Screen
          name='notificationSettings'
          component={NotificationSettingsWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Notifications',
          })}
        />
        <SettingsStack.Screen
          name='changePassword'
          component={PasswordChangedWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Change Password',
          })}
        />
        <SettingsStack.Screen
          name='setNewPassword'
          component={SetPassword}
          options={getDefaultStackNavigationOptions({
            title: 'Create Password',
          })}
        />
        <SettingsStack.Screen
          name='setAutoLockTimer'
          component={AutoLockTimerWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Auto-Lock Timer',
          })}
        />
        <SettingsStack.Screen
          name='setLanguage'
          component={LanguageWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Language',
          })}
        />
        {/* wallet settings */}
        <SettingsStack.Screen
          name='editWallet'
          component={EditWalletWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Edit Wallet',
          })}
        />
        <SettingsStack.Screen
          name='editWalletSigners'
          component={EditWalletSignersWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Edit Signers',
          })}
        />
        <SettingsStack.Screen
          name='deriveMoreWallets'
          component={DeriveMoreWalletsWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Derive More Wallets',
          })}
        />
        <SettingsStack.Screen
          name='revealKey'
          component={RevealKeyWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <SettingsStack.Screen
          name='revealKeyWarning'
          component={RevealKeyWarningWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <SettingsStack.Screen
          name='multichainDeployChain'
          component={MultichainDeployChainScreenWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Multichain Deploy',
          })}
        />
        <SettingsStack.Screen
          name='multichainDeployExecute'
          component={MultichainDeployExecuteScreenWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Multichain Deploy',
          })}
        />
        <SettingsStack.Screen
          name='closeEmptyTokenAccounts'
          component={CloseEmptyTokenAccounts}
          options={getDefaultStackNavigationOptions({
            title: 'Token Accounts',
          })}
        />
        <SettingsStack.Screen
          name='walletVersion'
          component={WalletVersion}
          options={getDefaultStackNavigationOptions({
            title: 'Wallet Versions',
          })}
        />
      </SettingsStack.Navigator>
    </Portal.Host>
  );
}
