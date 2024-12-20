import { View } from '@nestwallet/app/components/view';
import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { MessageProposalWithData } from '../../../screens/app/proposal/message';
import { ApprovalMessageWithData } from '../../../screens/approval/message';
import { AppStackParamList, InternalMessageApprovalStack } from '../../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../options';

type RouteProps = StackScreenProps<
  AppStackParamList,
  'internalMessageApproval'
>;

export function InternalMessageApprovalNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <View className='h-full w-full overflow-hidden'>
        <InternalMessageApprovalStack.Navigator
          screenOptions={getModalStackNavigationOptions(props)}
        >
          <InternalMessageApprovalStack.Screen
            name='message'
            component={ApprovalMessageWithData}
            options={getDefaultStackNavigationOptions({
              title: '',
              headerLeft: () => <View />,
              headerTransparent: true,
            })}
          />
          <InternalMessageApprovalStack.Screen
            name='messageProposal'
            component={MessageProposalWithData}
            options={getDefaultStackNavigationOptions({
              title: 'Message Summary',
              headerLeft: () => <View />,
            })}
          />
        </InternalMessageApprovalStack.Navigator>
      </View>
    </Portal.Host>
  );
}
