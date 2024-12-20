import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { colors } from '@nestwallet/app/design/constants';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../common/header/utils';
import { CreateSafeSafeSummary } from '../screens/add-wallet/create-safe/safe-summary';
import { CreateSafeSelectChain } from '../screens/add-wallet/create-safe/select-chain';
import { CreateSafeSelectSigners } from '../screens/add-wallet/create-safe/signers';
import { AddWalletStackParamList, CreateSafeStack } from './types';

type RouteProps = NativeStackScreenProps<AddWalletStackParamList, 'createSafe'>;

export function CreateSafeNavigator(props: RouteProps) {
  return (
    <CreateSafeStack.Navigator
      screenOptions={{
        ...getModalStackNavigationOptions(props),
        headerRight: () => (
          <IconButton
            icon={faTimes}
            size={24}
            onPress={props.navigation.getParent()?.goBack}
            color={colors.textPrimary}
          />
        ),
      }}
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
  );
}
