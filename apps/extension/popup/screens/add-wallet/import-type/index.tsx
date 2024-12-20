import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ImportWalletTypeScreen } from '@nestwallet/app/screens/add-wallet/import-type/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';
import { openHardwareTab } from '../add-hardware';

type RouteProps = StackScreenProps<AddWalletStackParamList, 'importWalletType'>;

export const ImportWalletType = withUserContext(_ImportWalletType);

function _ImportWalletType({ route }: RouteProps) {
  const { blockchain } = route.params;
  const navigation = useNavigation();

  const handleAddSigner = () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletPersonal',
        params: {
          blockchain,
        },
      },
    });
  };

  const handleAddHardwareWallet = () => {
    if (blockchain !== IBlockchainType.Evm) {
      navigation.navigate('app', {
        screen: 'walletDetails',
      });
      openHardwareTab(blockchain, 'ledger');
    } else {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletHardware',
          params: {
            blockchain,
          },
        },
      });
    }
  };

  const handleAddSafe = async () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletAddSafe',
      },
    });
  };

  return (
    <ImportWalletTypeScreen
      blockchain={blockchain}
      onAddSigner={handleAddSigner}
      onAddHardware={handleAddHardwareWallet}
      onAddSafe={handleAddSafe}
    />
  );
}
