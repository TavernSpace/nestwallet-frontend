import { View } from '@nestwallet/app/components/view';
import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../common/header/utils';
import { TransactionProposalWithData } from '../screens/app/proposal/transaction';
import { ReceiveScreenWithData } from '../screens/app/receive';
import { SwapScreenWithData } from '../screens/app/swap';
import { SwapAssetWithData } from '../screens/app/swap/asset';
import { TransferAssetWithData } from '../screens/app/transfer/asset';
import { TransferReviewWithData } from '../screens/app/transfer/review';
import { AppStackParamList, WalletStack } from './types';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'wallet'>;

export function WalletNavigator(props: RouteProps) {
  return (
    <PortalProvider
      type={Platform.OS === 'ios' ? 'full' : 'none'}
      ignoreInset={Platform.OS === 'ios'}
    >
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
    </PortalProvider>
  );
}
