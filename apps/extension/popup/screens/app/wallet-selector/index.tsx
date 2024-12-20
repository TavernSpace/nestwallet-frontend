import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IUpsertWalletInput,
  IWallet,
  useUpsertWalletsMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { WalletSelector } from '@nestwallet/app/screens/wallet-selector/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';
import { DraggableList } from './drag';

type RouteProps = StackScreenProps<AppStackParamList, 'walletSelector'>;

export const WalletSelectorWithData = withUserContext(_WalletSelectorWithData);

function _WalletSelectorWithData({ route, navigation }: RouteProps) {
  const { wallets, refetch } = useUserContext();
  const { selectedWallet, setSelectedWallet } = useSelectedWallet();
  const rootNavigation = useNavigation();

  const upsertWalletsMutation = useMutationEmitter(
    graphqlType.Wallet,
    useUpsertWalletsMutation(),
  );

  const handleWalletPress = async (wallet: IWallet) => {
    await setSelectedWallet(wallet);
    rootNavigation.navigate('app', {
      screen: 'walletDetails',
      params: {
        walletId: wallet.id,
      },
    });
  };

  const handleAddWalletPress = () => {
    rootNavigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletBlockchainType',
      },
    });
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleUpdateWallets = async (input: IUpsertWalletInput[]) => {
    await upsertWalletsMutation.mutateAsync({
      input,
    });
  };

  const handleEditWallet = (wallet: IWallet) => {
    rootNavigation.navigate('app', {
      screen: 'editWallet',
      params: { walletId: wallet.id },
    });
  };

  return (
    <WalletSelector
      wallets={wallets}
      selectedWallet={selectedWallet.data || null}
      onRefresh={refetch}
      onWalletPress={handleWalletPress}
      onAddWalletPress={handleAddWalletPress}
      onClose={navigation.canGoBack() ? handleClose : undefined}
      onUpdateWallets={handleUpdateWallets}
      onEditWallet={handleEditWallet}
      DraggableList={DraggableList}
    />
  );
}
