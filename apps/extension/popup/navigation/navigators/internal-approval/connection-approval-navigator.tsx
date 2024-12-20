import { View } from '@nestwallet/app/components/view';
import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { ApprovalConnectionWithData } from '../../../screens/approval/connection';
import {
  AppStackParamList,
  InternalConnectionApprovalStack,
} from '../../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../options';

type RouteProps = StackScreenProps<
  AppStackParamList,
  'internalConnectionApproval'
>;

export function InternalConnectionApprovalNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <View className='h-full w-full overflow-hidden'>
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
            })}
          />
        </InternalConnectionApprovalStack.Navigator>
      </View>
    </Portal.Host>
  );
}
