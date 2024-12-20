import { View } from '@nestwallet/app/components/view';
import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { TransactionProposalWithData } from '../../../screens/app/proposal/transaction';
import { ApprovalTransactionWithData } from '../../../screens/approval/transaction';
import {
  AppStackParamList,
  InternalTransactionApprovalStack,
} from '../../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../options';

type RouteProps = StackScreenProps<
  AppStackParamList,
  'internalTransactionApproval'
>;

export function InternalTransactionApprovalNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <View className='h-full w-full overflow-hidden'>
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
      </View>
    </Portal.Host>
  );
}
