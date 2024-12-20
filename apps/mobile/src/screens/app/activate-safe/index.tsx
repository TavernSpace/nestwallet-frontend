import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ActivateSafeWithQuery } from '@nestwallet/app/screens/activate-safe/query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'activateSafe'>;

export const ActivateSafeWithData = withUserContext(_ActivateSafeWithData);

function _ActivateSafeWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { walletService } = useAppContext();
  const { user, signers, refetch } = useUserContext();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

  return wallet ? (
    <ActivateSafeWithQuery
      user={user}
      wallet={wallet}
      signers={signers.filter(
        (signer) => signer.blockchain === IBlockchainType.Evm,
      )}
      walletService={walletService}
      refetchUser={refetch}
      onCompleted={navigation.goBack}
    />
  ) : null;
}
