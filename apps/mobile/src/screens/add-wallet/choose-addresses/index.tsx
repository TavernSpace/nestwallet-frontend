import { Account } from '@nestwallet/app/common/types';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportWalletChooseAddressesScreen } from '@nestwallet/app/screens/add-wallet/choose-addresses/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';
import { useWalletFetcher } from './utils';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletChooseAddresses'
>;

export const ImportWalletChooseAddress = withUserContext(
  _ImportWalletChooseAddress,
);

function _ImportWalletChooseAddress({ route, navigation }: RouteProps) {
  const { blockchain, keyring, walletType } = route.params;
  const { accounts, signers } = useUserContext();
  const defaultAccount = accounts.find((account) => account.isDefault)!;

  const handleContinue = async (
    keyringIdentifier: string,
    accounts: Account[],
  ) => {
    const inputs = accounts.map((account) => {
      return {
        type: walletType,
        blockchain,
        name: '',
        organizationId: defaultAccount.organization.id,
        address: account.address,
        chainId: 0,
        derivationPath: account.derivationPath,
        keyringIdentifier: keyring?.keyringIdentifier ?? keyringIdentifier,
        version: blockchain === IBlockchainType.Tvm ? 'V4' : undefined,
      };
    });
    navigation.navigate('importWalletChooseNames', {
      keyring,
      inputs,
      walletType,
    });
  };

  const { fetch } = useWalletFetcher(blockchain, walletType, keyring);

  return (
    <ImportWalletChooseAddressesScreen
      blockchain={blockchain}
      walletType={walletType}
      importedWallets={signers}
      onContinue={handleContinue}
      fetchWallet={fetch}
    />
  );
}
