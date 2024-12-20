import {
  IBlockchainType,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { WindowType } from '@nestwallet/app/provider/nestwallet';
import { AddHardwareWalletScreen } from '@nestwallet/app/screens/add-wallet/add-hardware-wallet/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { browser } from 'webextension-polyfill-ts';
import { AddWalletStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<
  AddWalletStackParamList,
  'importWalletHardware'
>;

export async function openHardwareTab(
  blockchain: IBlockchainType,
  type: 'ledger' | 'trezor',
) {
  // wait to reset to initiate reset to home first. otherwise create tab
  // will close popup before we can navigate
  requestAnimationFrame(async () => {
    const url = browser.runtime.getURL('index.html');
    const searchParams = new URLSearchParams({
      type: WindowType.tab,
      blockchain,
      walletType: type,
    });
    const path = `${url}?${searchParams.toString()}#${
      type === 'ledger'
        ? '/app/addWallet/importHardwareConnectLedger'
        : '/app/addWallet/importWalletChooseAddresses'
    }`;
    await browser.tabs.create({
      url: path,
    });
  });
}

export const AddHardwareWallet = withUserContext(_AddHardwareWallet);

function _AddHardwareWallet({ route }: RouteProps) {
  const { blockchain } = route.params;
  const navigation = useNavigation();

  const handleSubmit = (walletType: string) => {
    navigation.navigate('app', {
      screen: 'walletDetails',
    });
    if (walletType === IWalletType.Ledger) {
      openHardwareTab(blockchain, 'ledger');
    } else if (walletType === IWalletType.Trezor) {
      openHardwareTab(blockchain, 'trezor');
    }
  };

  return <AddHardwareWalletScreen onSubmit={handleSubmit} />;
}
