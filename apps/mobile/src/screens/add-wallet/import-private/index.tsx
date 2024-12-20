import { IKeyring } from '@nestwallet/app/common/types';
import { getAddressFromPrivateKey } from '@nestwallet/app/features/wallet/seedphrase';
import {
  IUpsertWalletInput,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportPrivateKeyScreen } from '@nestwallet/app/screens/add-wallet/import-private/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletPrivateKey'
>;

export const ImportPrivateKey = withUserContext(({ route }: RouteProps) => {
  const { blockchain } = route.params;
  const { signers } = useUserContext();
  const navigation = useNavigation();

  const handleSubmit = async (privateKey: string) => {
    const address = getAddressFromPrivateKey(blockchain, privateKey);
    const hasSigner = !!signers.find(
      (account) => address === account.address && account.hasKeyring,
    );
    // if we find a signer with same address, wallet is imported
    if (hasSigner) {
      throw new Error('This wallet has already been imported');
    }
    const input: Partial<IUpsertWalletInput> = {
      blockchain,
      type: IWalletType.PrivateKey,
      address: address,
      keyringIdentifier: address,
    };
    const keyring: IKeyring = {
      blockchain,
      type: IWalletType.PrivateKey,
      keyringIdentifier: address,
      value: privateKey,
    };
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletChooseName',
        params: {
          input,
          keyring,
        },
      },
    });
  };
  return (
    <ImportPrivateKeyScreen blockchain={blockchain} onSubmit={handleSubmit} />
  );
});
