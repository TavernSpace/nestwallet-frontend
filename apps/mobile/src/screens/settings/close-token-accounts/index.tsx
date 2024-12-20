import { CloseEmptyTokenAccountsQuery } from '@nestwallet/app/screens/settings/close-token-accounts/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useWalletById } from '../../../hooks/wallet';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  SettingsStackParamList,
  'closeEmptyTokenAccounts'
>;

export const CloseEmptyTokenAccounts = withUserContext(
  _CloseEmptyTokenAccounts,
);

function _CloseEmptyTokenAccounts({ route }: RouteProps) {
  const { walletId } = route.params;
  const { walletService } = useAppContext();
  const { wallet } = useWalletById(walletId);
  const navigation = useNavigation();

  const handleCompleted = () => {
    navigation.navigate('app', {
      screen: 'walletDetails',
    });
  };

  return wallet ? (
    <CloseEmptyTokenAccountsQuery
      wallet={wallet}
      client={walletService}
      onCompleted={handleCompleted}
    />
  ) : null;
}
