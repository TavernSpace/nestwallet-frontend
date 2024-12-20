import EmptyWallet from '../../assets/images/empty-wallets.svg';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { TextButton } from '../../components/button/text-button';
import { Svg } from '../../components/svg';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { IUserAccount } from '../../graphql/client/generated/graphql';
import { UserMenu } from './menu';

export function EmptyWalletState(props: {
  userAccount: IUserAccount;
  onAddWallet: VoidFunction;
  onQuickStart: VoidFunction;
  onSettingsPress: VoidFunction;
  onNotificationsPress: VoidFunction;
  onLockPress?: VoidFunction;
  onOpenNewTab?: VoidFunction;
  onOpenSidePanel?: VoidFunction;
}) {
  const {
    userAccount,
    onAddWallet,
    onQuickStart,
    onSettingsPress,
    onNotificationsPress,
    onLockPress,
    onOpenNewTab,
    onOpenSidePanel,
  } = props;

  useNavigationOptions({
    headerShown: false,
  });

  return (
    <ViewWithInset
      className='h-full w-full'
      hasTopInset={true}
      hasBottomInset={true}
    >
      <View className='flex h-full flex-col justify-between px-4 pt-4'>
        <View className='items-end'>
          <UserMenu
            userAccount={userAccount}
            onSettingsPress={onSettingsPress}
            onNotificationsPress={onNotificationsPress}
            onLockPress={onLockPress}
            onOpenNewTab={onOpenNewTab}
            onOpenSidePanel={onOpenSidePanel}
          />
        </View>
        <View className='flex w-full flex-col items-center justify-center'>
          <Svg source={EmptyWallet} width={160} height={132} />
          <View className='mt-4 flex flex-col items-center space-y-2'>
            <Text className='text-text-primary text-lg font-medium'>
              Welcome to Nest Wallet
            </Text>
            <Text className='text-text-secondary text-sm font-normal'>
              Add a wallet and start trading with zero fees.
            </Text>
          </View>
        </View>
        <View className='flex w-full flex-col space-y-2'>
          <TextButton
            onPress={onQuickStart}
            type='primary'
            text='Quick Start'
          />
          <TextButton
            onPress={onAddWallet}
            type='tertiary'
            text='Add Manually'
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
