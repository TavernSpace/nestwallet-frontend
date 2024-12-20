import { Loadable } from '@nestwallet/app/common/types';
import { makeLoadable, onLoadable } from '@nestwallet/app/common/utils/query';
import {
  IWallet,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ErrorScreen } from '@nestwallet/app/molecules/error/screen';
import { EmptyWalletState } from '@nestwallet/app/screens/wallet-details/empty';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSelectedWallet } from '../../../hooks/selected-wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';
import { EoaWalletDetails } from './details/eoa';
import { SafeWalletDetails } from './details/safe';

type RouteProps = StackScreenProps<AppStackParamList, 'walletDetails'>;

export const WalletDetailsWithData = withUserContext(_WalletDetailsWithData);

function _WalletDetailsWithData(props: RouteProps) {
  const { walletId } = props.route.params || {};
  const { wallets, accounts } = useUserContext();
  const { selectedWallet } = useSelectedWallet();
  const navigation = useNavigation();

  const wallet = wallets.find((wallet) => wallet.id === walletId);
  const userAccount = accounts.find((account) => account.isDefault)!;

  const defaultWallet: Loadable<IWallet | null> = wallet
    ? makeLoadable(wallet)
    : selectedWallet;

  const handleAddWalletPress = () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'importWalletBlockchainType',
      },
    });
  };

  const handleReimportWalletPress = (wallet: IWallet) => {
    if (wallet.type === IWalletType.SeedPhrase) {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletImportSeed',
          params: {
            blockchain: wallet.blockchain,
          },
        },
      });
    } else if (wallet.type === IWalletType.PrivateKey) {
      navigation.navigate('app', {
        screen: 'addWallet',
        params: {
          screen: 'importWalletPrivateKey',
          params: {
            blockchain: wallet.blockchain,
          },
        },
      });
    }
  };

  const handleSettingsPress = () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'index',
        params: { walletId: undefined },
      },
    });
  };

  const handleNotificationsPress = () => {
    navigation.navigate('app', {
      screen: 'notifications',
    });
  };

  const handleQuickStartPress = async () => {
    navigation.navigate('app', {
      screen: 'addWallet',
      params: {
        screen: 'quickStart',
      },
    });
  };

  return onLoadable(defaultWallet)(
    () => null,
    () => (
      <ErrorScreen
        title='Unable to Load Wallets'
        description='Something went wrong trying to load your wallets.'
      />
    ),
    (wallet) =>
      wallet ? (
        wallet.type === IWalletType.Safe ? (
          <SafeWalletDetails {...props} wallet={wallet} />
        ) : (
          <EoaWalletDetails
            {...props}
            wallet={wallet}
            onReimportWalletPress={handleReimportWalletPress}
          />
        )
      ) : (
        <EmptyWalletState
          userAccount={userAccount}
          onAddWallet={handleAddWalletPress}
          onQuickStart={handleQuickStartPress}
          onSettingsPress={handleSettingsPress}
          onNotificationsPress={handleNotificationsPress}
        />
      ),
  );
}
