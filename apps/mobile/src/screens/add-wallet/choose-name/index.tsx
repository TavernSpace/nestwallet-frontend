import { delay } from '@nestwallet/app/common/api/utils';
import { ReactNativeFile } from '@nestwallet/app/common/hooks/graphql';
import {
  IUpsertWalletInput,
  IWallet,
  useUpsertWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { sanitizeUpsertWalletInput } from '@nestwallet/app/graphql/utils';
import { ChooseNameScreen } from '@nestwallet/app/screens/add-wallet/choose-name/screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  AddWalletStackParamList,
  'importWalletChooseName'
>;

export const ImportWalletChooseName = withUserContext(_ImportWalletChooseName);

function _ImportWalletChooseName({ route, navigation }: RouteProps) {
  const { input, keyring } = route.params;
  const { walletService } = useAppContext();
  const { accounts, wallets, refetch } = useUserContext();
  const { setSelectedWallet } = useSelectedWallet();

  const defaultAccount = accounts.find((account) => account.isDefault)!;
  const wallet = wallets.find((wallet) => wallet.address === input.address);
  const initialName = wallet?.name ?? '';
  const initialId = wallet?.id ?? undefined;

  const upsertWalletMutation = useUpsertWalletMutation();

  const handleSubmit = async (name: string, image?: File | ReactNativeFile) => {
    await walletService.createKeyring(keyring);
    const upsertWalletInput = sanitizeUpsertWalletInput({
      ...input,
      chainId: 0,
      organizationId: defaultAccount.organization.id,
      id: initialId,
      name,
      profilePictureUpload: image,
    } as IUpsertWalletInput);
    const wallet = await upsertWalletMutation.mutateAsync({
      input: upsertWalletInput,
    });
    await refetch();
    await setSelectedWallet(wallet.upsertWallet as IWallet);
    // short delay to allow for screen rerenders to prevent lag, adding signer causes userContext to rerender
    // and since the stack is fairly deep at this point navigating during rerender causes lag
    await delay(100);
    navigation.navigate('importSignerSuccess', {
      walletType: wallet.upsertWallet.type,
    });
  };

  return (
    <ChooseNameScreen
      wallet={wallet}
      blockchain={input.blockchain!}
      address={input.address!}
      onSubmit={handleSubmit}
      name={initialName}
    />
  );
}
