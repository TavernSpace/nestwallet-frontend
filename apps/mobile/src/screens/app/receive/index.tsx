import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { ReceiveScreen } from '@nestwallet/app/screens/receive/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useWalletById } from '../../../hooks/wallet';
import { WalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<WalletStackParamList, 'receive'>;

export const ReceiveScreenWithData = withUserContext(_ReceiveScreenWithData);

export function _ReceiveScreenWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  useResetToOnInvalid('app', !wallet);

  return wallet ? <ReceiveScreen wallet={wallet} /> : null;
}
