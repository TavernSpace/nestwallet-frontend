import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform, View } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../../common/header/utils';
import { ApprovalTransactionWithData } from '../../screens/app/approval/transaction';
import { TransactionProposalWithData } from '../../screens/app/proposal/transaction';
import { InternalTransactionApprovalStack, RootStackParamList } from '../types';

type RouteProps = NativeStackScreenProps<
  RootStackParamList,
  'internalTransactionApproval'
>;

export function InternalTransactionApprovalNavigator(props: RouteProps) {
  return (
    <PortalProvider
      type={Platform.OS === 'ios' ? 'full' : 'none'}
      ignoreInset={Platform.OS === 'ios'}
    >
      <InternalTransactionApprovalStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <InternalTransactionApprovalStack.Screen
          name='transaction'
          component={ApprovalTransactionWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerLeft: () => <View />,
            headerTransparent: true,
            headerStyle: undefined,
          })}
        />
        <InternalTransactionApprovalStack.Screen
          name='transactionProposal'
          component={TransactionProposalWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Transaction Summary',
            headerLeft: () => <View />,
          })}
        />
      </InternalTransactionApprovalStack.Navigator>
    </PortalProvider>
  );
}
