import { delay } from '@nestwallet/app/common/api/utils';
import { ReactNativeFile } from '@nestwallet/app/common/hooks/graphql';
import {
  IUpsertWalletInput,
  IWallet,
  IWalletType,
  useUpsertWalletMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { sanitizeUpsertWalletInput } from '@nestwallet/app/graphql/utils';
import { ChooseNameScreen } from '@nestwallet/app/screens/add-wallet/choose-name/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletChooseName'
>;

export const ImportWalletChooseName = withUserContext(_ImportWalletChooseName);

function _ImportWalletChooseName({ route, navigation }: RouteProps) {
  const { input, keyring } = route.params;
  const { walletService } = useAppContext();
  const { accounts, wallets, refetch } = useUserContext();
  const { unlock } = useLockContext();
  const { setSelectedWallet } = useSelectedWallet();
  const defaultAccount = accounts.find((account) => account.isDefault)!;

  // loop through wallets to find initial name and id
  const wallet = wallets.find((wallet) => wallet.address === input.address);
  const initialName = wallet?.name ?? '';
  const initialId = wallet?.id ?? undefined;

  const upsertWalletMutation = useUpsertWalletMutation();

  const handleSubmit = async (name: string, image?: File | ReactNativeFile) => {
    await unlock();
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
      walletType: IWalletType.PrivateKey,
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
