import { TrezorRequest } from '@nestwallet/app/features/keyring/trezor/types';
import { getTrezorRequestPayload } from '@nestwallet/app/features/keyring/trezor/utils';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { openInTab } from '../../../navigation/utils';

export async function openTrezorRequest(wallet: IWallet, data: TrezorRequest) {
  return openTrezorRequestString(getTrezorRequestPayload(wallet, data));
}

export async function openTrezorRequestString(payload: object) {
  return openInTab('app/trezorRequest', payload);
}
