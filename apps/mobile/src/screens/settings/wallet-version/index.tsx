import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { WalletVersionWithQuery } from '@nestwallet/app/screens/settings/wallet-version/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useWalletById } from '../../../hooks/wallet';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'walletVersion'>;

export const WalletVersion = withUserContext(_WalletVersion);

function _WalletVersion({ route }: RouteProps) {
  const { walletId } = route.params;
  const { walletService } = useAppContext();
  const { wallets, user } = useUserContext();
  const { wallet } = useWalletById(walletId);
  const navigation = useNavigation();

  const organization = user.accounts.find(
    (account) => account.isDefault,
  )!.organization;

  const handleAddWallets = async (
    versions: { address: string; version: string }[],
  ) => {
    if (wallet) {
      const keyring = await walletService.getKeyring(wallet.keyringIdentifier!);
      const inputs = versions.map(({ address, version }) => {
        return {
          type: wallet.type,
          blockchain: IBlockchainType.Tvm,
          name: '',
          organizationId: organization.id,
          address,
          chainId: 0,
          derivationPath: wallet.derivationPath,
          keyringIdentifier: wallet.keyringIdentifier,
          version,
        };
      });
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletChooseNames',
          params: {
            keyring,
            inputs,
            walletType: wallet.type,
          },
        },
      });
    }
  };

  return wallet ? (
    <WalletVersionWithQuery
      wallet={wallet}
      wallets={wallets}
      client={walletService}
      onAddWallets={handleAddWallets}
    />
  ) : null;
}
