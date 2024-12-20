import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { CreateSafeSafeSummary } from '../../screens/add-wallet/create-safe/safe-summary';
import { CreateSafeSelectChain } from '../../screens/add-wallet/create-safe/select-chain';
import { CreateSafeSelectSigners } from '../../screens/add-wallet/create-safe/signers';
import { AddWalletStackParamList, CreateSafeStack } from '../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from './options';

type RouteProps = StackScreenProps<AddWalletStackParamList, 'createSafe'>;

export function CreateSafeNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <CreateSafeStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <CreateSafeStack.Screen
          name='signers'
          component={CreateSafeSelectSigners}
          options={getDefaultStackNavigationOptions({
            title: 'Select Signers',
          })}
        />
        <CreateSafeStack.Screen
          name='selectChain'
          component={CreateSafeSelectChain}
          options={getDefaultStackNavigationOptions({
            title: 'Select Network',
          })}
        />
        <CreateSafeStack.Screen
          name='safeSummary'
          component={CreateSafeSafeSummary}
          options={getDefaultStackNavigationOptions({
            title: 'Review Safe',
          })}
        />
      </CreateSafeStack.Navigator>
    </Portal.Host>
  );
}
