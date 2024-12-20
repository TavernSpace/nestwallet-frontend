import { View } from '@nestwallet/app/components/view';
import { StackScreenProps } from '@react-navigation/stack';
import { Portal } from 'react-native-paper';
import { TransactionProposalWithData } from '../../screens/app/proposal/transaction';
import { ReceiveScreenWithData } from '../../screens/app/receive';
import { SwapScreenWithData } from '../../screens/app/swap';
import { SwapAssetWithData } from '../../screens/app/swap/asset';
import { TransferAssetWithData } from '../../screens/app/transfer/asset';
import { TransferReviewWithData } from '../../screens/app/transfer/review';
import { AppStackParamList, WalletStack } from '../types';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from './options';

type RouteProps = StackScreenProps<AppStackParamList, 'wallet'>;

export function WalletNavigator(props: RouteProps) {
  return (
    <Portal.Host>
      <WalletStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        {/* transfer */}
        <WalletStack.Screen
          name='transferAsset'
          component={TransferAssetWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Send',
            headerLeft: () => <View />,
          })}
        />
        <WalletStack.Screen
          name='transferReview'
          component={TransferReviewWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Send',
          })}
        />
        <WalletStack.Screen
          name='swapAsset'
          component={SwapAssetWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Select Token',
          })}
        />
        <WalletStack.Screen
          name='swap'
          component={SwapScreenWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Bridge',
          })}
        />
        <WalletStack.Screen
          name='receive'
          component={ReceiveScreenWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Receive',
          })}
        />
        <WalletStack.Screen
          name='transactionProposal'
          component={TransactionProposalWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Transaction Summary',
          })}
        />
      </WalletStack.Navigator>
    </Portal.Host>
  );
}
