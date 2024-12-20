import { onBlockchain } from '@nestwallet/app/features/chain';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportWalletBlockchainTypeScreen } from '@nestwallet/app/screens/add-wallet/import-blockchain/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletBlockchainType'
>;

export const ImportWalletBlockchainType = withUserContext(
  _ImportWalletBlockchainType,
);

function _ImportWalletBlockchainType({ route }: RouteProps) {
  const navigation = useNavigation();

  const handleSubmit = (blockchain: IBlockchainType) => {
    onBlockchain(blockchain)(
      () => {
        navigation.navigate('app', {
          screen: 'addWallet',
          params: {
            screen: 'importWalletType',
            params: {
              blockchain,
            },
          },
        });
      },
      () => {
        navigation.navigate('app', {
          screen: 'addWallet',
          params: {
            screen: 'importWalletType',
            params: {
              blockchain,
            },
          },
        });
      },
      () => {
        navigation.navigate('app', {
          screen: 'addWallet',
          params: {
            screen: 'importWalletPersonal',
            params: {
              blockchain,
            },
          },
        });
      },
    );
  };

  return <ImportWalletBlockchainTypeScreen onSubmit={handleSubmit} />;
}
