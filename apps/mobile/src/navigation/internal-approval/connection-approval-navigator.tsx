import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../../common/header/utils';
import { ApprovalConnectionWithData } from '../../screens/app/approval/connection';
import { InternalConnectionApprovalStack, RootStackParamList } from '../types';

type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'internalConnectionApproval'
>;

export function InternalConnectionApprovalNavigator(props: RouteProps) {
  return (
    <PortalProvider
      type={Platform.OS === 'ios' ? 'full' : 'none'}
      ignoreInset={Platform.OS === 'ios'}
    >
      <InternalConnectionApprovalStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <InternalConnectionApprovalStack.Screen
          name='connection'
          component={ApprovalConnectionWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerLeft: () => <View />,
            headerTransparent: true,
            headerStyle: undefined,
          })}
        />
      </InternalConnectionApprovalStack.Navigator>
    </PortalProvider>
  );
}
