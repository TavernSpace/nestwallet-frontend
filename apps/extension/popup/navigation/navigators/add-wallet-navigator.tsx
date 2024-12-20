import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { AddHardwareWallet } from '../../screens/add-wallet/add-hardware';
import { AddPersonalWallet } from '../../screens/add-wallet/add-personal';
import { AddSafeWallet } from '../../screens/add-wallet/add-safe';
import { ImportWalletChooseAddress } from '../../screens/add-wallet/choose-addresses';
import { ImportWalletChooseName } from '../../screens/add-wallet/choose-name';
import { ImportWalletChooseNames } from '../../screens/add-wallet/choose-names';
import { ImportHardwareConnectLedger } from '../../screens/add-wallet/connect-ledger';
import { ImportWalletCreateSeed } from '../../screens/add-wallet/create-seed';
import { ImportWalletBlockchainType } from '../../screens/add-wallet/import-blockchain';
import { ImportExistingSafeWithData } from '../../screens/add-wallet/import-existing-safe';
import { ImportPrivateKey } from '../../screens/add-wallet/import-private';
import { ImportWalletImportSeed } from '../../screens/add-wallet/import-seed';
import { ImportWalletType } from '../../screens/add-wallet/import-type';
import { QuickStart } from '../../screens/add-wallet/quick-start';
import { ImportWalletSeedType } from '../../screens/add-wallet/seed-type';
import { ImportSignerWalletSuccess } from '../../screens/add-wallet/success-signer';
import { AddWalletStack, AppStackParamList } from '../types';
import { CreateSafeNavigator } from './create-safe-navigator';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from './options';

type RouteProps = StackScreenProps<AppStackParamList, 'addWallet'>;

export function AddWalletNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <AddWalletStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <AddWalletStack.Screen
          name='importWalletBlockchainType'
          component={ImportWalletBlockchainType}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerLeft: () => null,
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
          name='importWalletHardware'
          component={AddHardwareWallet}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <AddWalletStack.Screen
          name='importHardwareConnectLedger'
          component={ImportHardwareConnectLedger}
          options={getDefaultStackNavigationOptions({
            title: 'Connect Ledger',
            headerLeft: () => null,
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
          name='importSignerSuccess'
          component={ImportSignerWalletSuccess}
          options={getDefaultStackNavigationOptions({
            headerShown: false,
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
          name='importWalletImportSeed'
          component={ImportWalletImportSeed}
          options={getDefaultStackNavigationOptions({
            title: 'Enter Seed Phrase',
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
        {/* setup wallet flow */}
        <AddWalletStack.Screen
          name='createSafe'
          component={CreateSafeNavigator}
          options={{
            animationEnabled: true,
            headerShown: false,
          }}
        />
        <AddWalletStack.Screen
          name='quickStart'
          component={QuickStart}
          options={getDefaultStackNavigationOptions({
            title: 'Quick Start',
          })}
        />
      </AddWalletStack.Navigator>
    </Portal.Host>
  );
}
