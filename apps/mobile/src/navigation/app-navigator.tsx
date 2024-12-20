import { TabBarVisibilityProvider } from '@nestwallet/app/provider/tab-bar';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import { getDefaultStackNavigationOptions } from '../common/header/utils';
import { ExecutionProvider } from '../provider/execution';
import { NotificationProvider } from '../provider/notification';
import { AuthorizedUserContextProvider } from '../provider/user/auth';
import { ActivateSafeWithData } from '../screens/app/activate-safe';
import { EditWalletWithData } from '../screens/app/edit-wallet';
import { NftDetailsWithData } from '../screens/app/nft-details';
import { NotificationsWithData } from '../screens/app/notifications';
import { MessageProposalWithData } from '../screens/app/proposal/message';
import { TransactionProposalWithData } from '../screens/app/proposal/transaction';
import { QuickTradeScreenWithData } from '../screens/app/quick-trade';
import { TransactionDetailScreenWithData } from '../screens/app/transaction-detail';
import { WalletDetailsWithData } from '../screens/app/wallet';
import { WalletSelectorWithData } from '../screens/app/wallet-selector';
import { WalletProposalsWithData } from '../screens/app/wallet/proposals';
import { AddWalletNavigator } from './add-wallet-navigator';
import { InternalConnectionApprovalNavigator } from './internal-approval/connection-approval-navigator';
import { InternalMessageApprovalNavigator } from './internal-approval/message-approval-navigator';
import { InternalTransactionApprovalNavigator } from './internal-approval/transaction-approval-navigator';
import { QuestNavigator } from './quest-navigator';
import { SettingsNavigator } from './settings-navigator';
import { AppStack, RootStackParamList } from './types';
import { WalletNavigator } from './wallet-navigator';

type RouteProps = NativeStackScreenProps<RootStackParamList, 'app'>;

export function AppNavigator(props: RouteProps) {
  return (
    <TabBarVisibilityProvider>
      <AuthorizedUserContextProvider>
        <ExecutionProvider>
          <NotificationProvider>
            <AppStack.Navigator>
              {/* wallets */}
              <AppStack.Screen
                name='walletDetails'
                component={WalletDetailsWithData}
                options={{
                  headerShown: false,
                }}
              />
              <AppStack.Screen
                name='walletSelector'
                component={WalletSelectorWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Select Wallet',
                  animationDuration: 300,
                  animation:
                    Platform.OS === 'android'
                      ? 'fade_from_bottom'
                      : 'slide_from_bottom',
                })}
              />
              <AppStack.Screen
                name='walletProposals'
                component={WalletProposalsWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Proposals',
                })}
              />
              <AppStack.Screen
                name='activateSafe'
                component={ActivateSafeWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Activate Safe',
                })}
              />
              <AppStack.Screen
                name='transaction'
                component={TransactionDetailScreenWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Transaction History',
                })}
              />
              <AppStack.Screen
                name='nftDetails'
                component={NftDetailsWithData}
                options={getDefaultStackNavigationOptions({
                  title: '',
                })}
              />
              <AppStack.Screen
                name='trade'
                component={QuickTradeScreenWithData}
                options={getDefaultStackNavigationOptions({
                  title: '',
                })}
              />
              {/* proposal */}
              <AppStack.Screen
                name='transactionProposal'
                component={TransactionProposalWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Transaction Summary',
                })}
              />
              <AppStack.Screen
                name='messageProposal'
                component={MessageProposalWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Message Summary',
                })}
              />
              <AppStack.Screen
                name='notifications'
                component={NotificationsWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Notifications',
                })}
              />
              {/* add wallet flow */}
              <AppStack.Screen
                name='addWallet'
                component={AddWalletNavigator}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              {/* settings */}
              <AppStack.Screen
                name='settings'
                component={SettingsNavigator}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              <AppStack.Screen
                name='editWallet'
                component={EditWalletWithData}
                options={getDefaultStackNavigationOptions({
                  title: 'Edit Wallet',
                })}
              />
              {/* wallet specific screens */}
              <AppStack.Screen
                name='wallet'
                component={WalletNavigator}
                options={{
                  headerShown: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              <AppStack.Screen
                name='internalConnectionApproval'
                component={InternalConnectionApprovalNavigator}
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              <AppStack.Screen
                name='internalTransactionApproval'
                component={InternalTransactionApprovalNavigator}
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              <AppStack.Screen
                name='internalMessageApproval'
                component={InternalMessageApprovalNavigator}
                options={{
                  headerShown: false,
                  gestureEnabled: false,
                  presentation: 'modal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
              <AppStack.Screen
                name='quest'
                component={QuestNavigator}
                options={{
                  headerShown: false,
                  presentation:
                    Platform.OS === 'android' ? 'modal' : 'fullScreenModal',
                  animation:
                    Platform.OS === 'android' ? 'fade_from_bottom' : undefined,
                }}
              />
            </AppStack.Navigator>
          </NotificationProvider>
        </ExecutionProvider>
      </AuthorizedUserContextProvider>
    </TabBarVisibilityProvider>
  );
}
