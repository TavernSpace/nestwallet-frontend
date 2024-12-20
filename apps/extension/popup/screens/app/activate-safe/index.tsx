import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ActivateSafeWithQuery } from '@nestwallet/app/screens/activate-safe/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'activateSafe'>;

export const ActivateSafeWithData = withUserContext(_ActivateSafeWithData);

function _ActivateSafeWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { user, signers, refetch } = useUserContext();
  const { client } = useLockContext();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

  return wallet ? (
    <ActivateSafeWithQuery
      user={user}
      wallet={wallet}
      signers={signers.filter(
        (signer) => signer.blockchain === IBlockchainType.Evm,
      )}
      walletService={client}
      refetchUser={refetch}
      onCompleted={navigation.goBack}
    />
  ) : null;
}
