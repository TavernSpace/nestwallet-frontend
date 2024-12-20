import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IUpsertWalletInput,
  IWallet,
  useDeleteWalletMutation,
  useUpsertWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { sanitizeUpsertWalletInput } from '@nestwallet/app/graphql/utils';
import { EditWalletScreen } from '@nestwallet/app/screens/wallet/edit-wallet/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'editWallet'>;

export const EditWalletWithData = withUserContext(_EditWalletWithData);

function _EditWalletWithData({ route, navigation }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { deleteWallet } = useSelectedWallet();
  useResetToOnInvalid('app', !wallet);

  const upsertWalletMutation = useMutationEmitter(
    graphqlType.Wallet,
    useUpsertWalletMutation(),
  );
  const deleteWalletMutation = useMutationEmitter(
    graphqlType.Wallet,
    useDeleteWalletMutation(),
  );

  const handleUpsertWallet = async (value: IUpsertWalletInput) => {
    const input = sanitizeUpsertWalletInput(value);
    await upsertWalletMutation.mutateAsync({
      input,
    });
    navigation.goBack();
  };

  const handleDeleteWallet = async (wallet: IWallet) => {
    await deleteWalletMutation.mutateAsync({ id: wallet.id });
    await deleteWallet(wallet);
    navigation.goBack();
  };

  return wallet ? (
    <EditWalletScreen
      wallet={wallet}
      onUpdateWallet={handleUpsertWallet}
      onDelete={() => handleDeleteWallet(wallet)}
    />
  ) : null;
}
