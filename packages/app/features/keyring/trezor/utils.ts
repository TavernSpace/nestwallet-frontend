import {
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { WindowType } from '../../../provider/nestwallet';
import { TrezorRequest } from './types';

export function shouldOpenTab(
  windowType: WindowType,
  wallet: IWallet | undefined,
) {
  if (!wallet) return false;
  return windowType === WindowType.popup && wallet?.type === IWalletType.Trezor;
}

export function getTrezorRequestPayload(
  wallet: IWallet,
  request: TrezorRequest,
) {
  return {
    walletId: wallet.id,
    request,
  };
}
