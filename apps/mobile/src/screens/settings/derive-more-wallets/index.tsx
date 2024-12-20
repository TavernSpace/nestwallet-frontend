import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { IWalletType } from '@nestwallet/app/graphql/client/generated/graphql';
import { DeriveMoreWalletsScreen } from '@nestwallet/app/screens/settings/derive-more-wallets/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSignerById } from '../../../hooks/signer';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'deriveMoreWallets'>;

export const DeriveMoreWalletsWithData = withUserContext(
  _DeriveMoreWalletsWithData,
);

export function _DeriveMoreWalletsWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { signer } = useSignerById(walletId);
  const { walletService } = useAppContext();
  const { signers } = useUserContext();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !signer);

  const importedWallets = signers.filter((wallet) => {
    return (
      wallet.keyringIdentifier == signer?.keyringIdentifier &&
      wallet.blockchain == signer?.blockchain
    );
  });

  const handleAddAddresses = async () => {
    const keyring = await walletService.getKeyring(signer!.keyringIdentifier!);
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletChooseAddresses',
        params: {
          blockchain: signer!.blockchain,
          keyring: keyring,
          walletType: IWalletType.SeedPhrase,
        },
      },
    });
  };

  return signer ? (
    <DeriveMoreWalletsScreen
      importedWallets={importedWallets}
      onAddAddresses={handleAddAddresses}
    />
  ) : null;
}
