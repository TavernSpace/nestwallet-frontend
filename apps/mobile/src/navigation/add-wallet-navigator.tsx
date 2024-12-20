import { View } from '@nestwallet/app/components/view';
import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../common/header/utils';
import { ImportExistingSafeWithData } from '../screens/add-wallet/add-existing-safe';
import { AddPersonalWallet } from '../screens/add-wallet/add-personal';
import { AddSafeWallet } from '../screens/add-wallet/add-safe';
import { ImportWalletChooseAddress } from '../screens/add-wallet/choose-addresses';
import { ImportWalletChooseName } from '../screens/add-wallet/choose-name';
import { ImportWalletChooseNames } from '../screens/add-wallet/choose-names';
import { ImportWalletCreateSeed } from '../screens/add-wallet/create-seed';
import { ImportWalletBlockchainType } from '../screens/add-wallet/import-blockchain';
import { ImportPrivateKey } from '../screens/add-wallet/import-private';
import { ImportWalletImportSeed } from '../screens/add-wallet/import-seed';
import { ImportWalletType } from '../screens/add-wallet/import-type';
import { QuickStart } from '../screens/add-wallet/quick-start';
import { ImportWalletSeedType } from '../screens/add-wallet/seed-type';
import { ImportSignerWalletSuccess } from '../screens/add-wallet/success-signer';
import { CreateSafeNavigator } from './create-safe-navigator';
import { AddWalletStack, AppStackParamList } from './types';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'addWallet'>;

export function AddWalletNavigator(props: RouteProps) {
  return (
    <PortalProvider
      type={Platform.OS === 'ios' ? 'full' : 'none'}
      ignoreInset={Platform.OS === 'ios'}
    >
      <AddWalletStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <AddWalletStack.Screen
          name='importWalletBlockchainType'
          component={ImportWalletBlockchainType}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerLeft: () => <View />,
          })}
        />
        <AddWalletStack.Screen
          name='importWalletType'
          component={ImportWalletType}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletAddSafe'
          component={AddSafeWallet}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletExistingSafe'
          component={ImportExistingSafeWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Add a Safe',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletPersonal'
          component={AddPersonalWallet}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletPrivateKey'
          component={ImportPrivateKey}
          options={getDefaultStackNavigationOptions({
            title: 'Enter Private Key',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletImportSeed'
          component={ImportWalletImportSeed}
          options={getDefaultStackNavigationOptions({
            title: 'Enter Seed Phrase',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletCreateSeed'
          component={ImportWalletCreateSeed}
          options={getDefaultStackNavigationOptions({
            title: 'Create Wallet',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletChooseAddresses'
          component={ImportWalletChooseAddress}
          options={getDefaultStackNavigationOptions({
            title: 'Select Addresses',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletSeedType'
          component={ImportWalletSeedType}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletChooseName'
          component={ImportWalletChooseName}
          options={getDefaultStackNavigationOptions({
            title: 'Edit Wallet',
          })}
        />
        <AddWalletStack.Screen
          name='importWalletChooseNames'
          component={ImportWalletChooseNames}
          options={getDefaultStackNavigationOptions({
            title: 'Name Wallets',
          })}
        />
        <AddWalletStack.Screen
          name='importSignerSuccess'
          component={ImportSignerWalletSuccess}
          options={{ headerShown: false }}
        />
        {/* setup wallet flow */}
        <AddWalletStack.Screen
          name='createSafe'
          component={CreateSafeNavigator}
          options={{ headerShown: false }}
        />
        <AddWalletStack.Screen
          name='quickStart'
          component={QuickStart}
          options={getDefaultStackNavigationOptions({
            title: 'Quick Start',
          })}
        />
      </AddWalletStack.Navigator>
    </PortalProvider>
  );
}
