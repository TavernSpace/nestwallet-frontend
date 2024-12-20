import {
  IUpsertWalletInput,
  IWallet,
  useUpsertWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportExistingSafeScreen } from '@nestwallet/app/screens/add-wallet/import-existing-safe/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { ethers } from 'ethers';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletExistingSafe'
>;

export const ImportExistingSafeWithData = withUserContext(
  _ImportExistingSafeWithData,
);

function _ImportExistingSafeWithData({ route }: RouteProps) {
  const { accounts, refetch } = useUserContext();
  const { setSelectedWallet } = useSelectedWallet();
  const navigation = useNavigation();

  // since we are manually refetching, don't need to use mutationEmitter
  const upsertWalletMutation = useUpsertWalletMutation();

  const defaultOrganization = accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const handleCreateWallet = async (value: IUpsertWalletInput) => {
    const result = await upsertWalletMutation.mutateAsync({
      input: { ...value, address: ethers.getAddress(value.address) },
    });
    const wallet = result.upsertWallet as IWallet;
    await refetch();
    await setSelectedWallet(wallet);
    navigation.navigate('app', {
      screen: 'walletDetails',
      params: {
        walletId: wallet.id,
      },
    });
  };

  return (
    <ImportExistingSafeScreen
      onCreateWallet={handleCreateWallet}
      organization={defaultOrganization}
    />
  );
}
