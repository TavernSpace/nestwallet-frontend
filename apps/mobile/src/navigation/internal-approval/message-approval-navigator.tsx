import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../../common/header/utils';
import { ApprovalMessageWithData } from '../../screens/app/approval/message';
import { MessageProposalWithData } from '../../screens/app/proposal/message';
import { InternalMessageApprovalStack, RootStackParamList } from '../types';

type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'internalMessageApproval'
>;

export function InternalMessageApprovalNavigator(props: RouteProps) {
  return (
    <PortalProvider
      type={Platform.OS === 'ios' ? 'full' : 'none'}
      ignoreInset={Platform.OS === 'ios'}
    >
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
            headerStyle: undefined,
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
    </PortalProvider>
  );
}
