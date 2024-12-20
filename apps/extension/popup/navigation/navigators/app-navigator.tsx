import { View } from '@nestwallet/app/components/view';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { TabBarVisibilityProvider } from '@nestwallet/app/provider/tab-bar';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { useInitializeSidepanel } from '../../hooks/sidepanel';
import { ExecutionProvider } from '../../provider/execution';
import { AuthorizedUserContextProvider } from '../../provider/user/auth';
import { ActivateSafeWithData } from '../../screens/app/activate-safe';
import { EditWalletWithData } from '../../screens/app/edit-wallet';
import { NftDetailsWithData } from '../../screens/app/nft-details';
import { NotificationsWithData } from '../../screens/app/notifications';
import { MessageProposalWithData } from '../../screens/app/proposal/message';
import { TransactionProposalWithData } from '../../screens/app/proposal/transaction';
import { TrezorRequestWithData } from '../../screens/app/proposal/trezor';
import { QuickTradeScreenWithData } from '../../screens/app/quick-trade';
import { TransactionDetailScreenWithData } from '../../screens/app/transaction-detail';
import { WalletDetailsWithData } from '../../screens/app/wallet';
import { WalletSelectorWithData } from '../../screens/app/wallet-selector';
import { WalletProposalsWithData } from '../../screens/app/wallet/proposals';
import { AppStack, RootStackParamList } from '../types';
import { AddWalletNavigator } from './add-wallet-navigator';
import { InternalConnectionApprovalNavigator } from './internal-approval/connection-approval-navigator';
import { InternalMessageApprovalNavigator } from './internal-approval/message-approval-navigator';
import { InternalTransactionApprovalNavigator } from './internal-approval/transaction-approval-navigator';
import {
  defaultModalInterpolator,
  getDefaultStackNavigationOptions,
} from './options';
import { QuestNavigator } from './quest-navigator';
import { SettingsNavigator } from './settings-navigator';
import { WalletNavigator } from './wallet-navigator';

type RouteProps = StackScreenProps<RootStackParamList, 'app'>;

export function AppNavigator({ navigation }: RouteProps) {
  const { windowType } = useNestWallet();
  const queryClient = useQueryClient();

  useInitializeSidepanel(windowType, queryClient, navigation);

  return (
    <TabBarVisibilityProvider>
      <AuthorizedUserContextProvider>
        <ExecutionProvider>
          <View className='h-full w-full overflow-hidden'>
            <AppStack.Navigator
              screenOptions={{
                animationEnabled: true,
              }}
            >
              {/* wallets */}
              <AppStack.Screen
                name='walletDetails'
                component={WalletDetailsWithData}
                options={{ headerShown: false }}
              />
              <AppStack.Group
                screenOptions={getDefaultStackNavigationOptions({
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                })}
              >
                <AppStack.Screen
                  name='walletSelector'
                  component={WalletSelectorWithData}
                  options={getDefaultStackNavigationOptions({
                    title: 'Select Wallet',
                  })}
                />
                <AppStack.Screen
                  name='editWallet'
                  component={EditWalletWithData}
                  options={getDefaultStackNavigationOptions({
                    title: 'Edit Wallet',
                  })}
                />
              </AppStack.Group>
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
                name='trezorRequest'
                component={TrezorRequestWithData}
                options={getDefaultStackNavigationOptions({
                  headerShown: false,
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
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
              {/* settings */}
              <AppStack.Screen
                name='settings'
                component={SettingsNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
              {/* wallet specific screens */}
              <AppStack.Screen
                name='wallet'
                component={WalletNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
              {/* quest specific screens */}
              <AppStack.Screen
                name='quest'
                component={QuestNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                }}
              />
              {/* Sidepanel Approval Stack Navigators */}
              <AppStack.Screen
                name='internalConnectionApproval'
                component={InternalConnectionApprovalNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
              <AppStack.Screen
                name='internalTransactionApproval'
                component={InternalTransactionApprovalNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
              <AppStack.Screen
                name='internalMessageApproval'
                component={InternalMessageApprovalNavigator}
                options={{
                  animationEnabled: true,
                  headerShown: false,
                  detachPreviousScreen: false,
                  cardStyleInterpolator: defaultModalInterpolator,
                }}
              />
            </AppStack.Navigator>
          </View>
        </ExecutionProvider>
      </AuthorizedUserContextProvider>
    </TabBarVisibilityProvider>
  );
}
