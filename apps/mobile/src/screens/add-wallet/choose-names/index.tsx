import { delay } from '@nestwallet/app/common/api/utils';
import { onBlockchain } from '@nestwallet/app/features/chain';
import { WalletTypePrefixes } from '@nestwallet/app/features/wallet/utils';
import {
  IUpsertWalletInput,
  IWallet,
  IWalletType,
  useUpsertWalletsMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ChooseNamesScreen } from '@nestwallet/app/screens/add-wallet/choose-names/screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  AddWalletStackParamList,
  'importWalletChooseNames'
>;

export const ImportWalletChooseNames = withUserContext(
  _ImportWalletChooseNames,
);

function _ImportWalletChooseNames({ route, navigation }: RouteProps) {
  const { keyring, inputs, walletType } = route.params;
  const { walletService } = useAppContext();
  const { wallets, refetch } = useUserContext();
  const { setSelectedWallet } = useSelectedWallet();

  const upsertWalletsMutation = useUpsertWalletsMutation();

  useMemo(() => {
    inputs.forEach((input, index) => {
      const wallet = wallets.find((wallet) => wallet.address === input.address);
      const blockchain = inputs[0]!.blockchain!;
      const prefix = onBlockchain(blockchain)(
        () => 'Ethereum ',
        () => 'Solana ',
        () => `TON ${input.version ?? 'V4'} `,
      );
      const initialName =
        wallet?.name ??
        `${prefix}${WalletTypePrefixes[walletType]} ${index + 1}`;
      const initialId = wallet?.id ?? undefined;
      input.name = initialName;
      if (initialId) {
        input.id = initialId;
      }
    });
  }, [inputs]);

  const handleSubmit = async (input: IUpsertWalletInput[]) => {
    const isSeed = keyring && keyring.type === IWalletType.SeedPhrase;
    if (isSeed) {
      await walletService.createKeyring(keyring);
    }
    const wallets = await upsertWalletsMutation.mutateAsync({
      input,
    });
    await refetch();
    await setSelectedWallet(wallets.upsertWallets[0] as IWallet);
    // short delay to allow for screen rerenders to prevent lag, adding signer causes userContext to rerender
    // and since the stack is fairly deep at this point navigating during rerender causes lag
    await delay(100);
    navigation.navigate('importSignerSuccess', {
      walletType,
    });
  };

  return (
    <ChooseNamesScreen
      inputs={inputs}
      walletType={walletType}
      onSubmit={handleSubmit}
    />
  );
}
