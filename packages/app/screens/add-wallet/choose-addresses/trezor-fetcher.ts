import { HDNodeVoidWallet, HDNodeWallet } from 'ethers';
import { useState } from 'react';
import { getTrezorAddresses } from '../../../features/keyring/trezor';

export function useTrezorFetcher() {
  const [hdNode, setHdNode] = useState<
    HDNodeWallet | HDNodeVoidWallet | undefined
  >(undefined);

  async function fetch(curAddress: number, numAddresses: number) {
    const res = await getTrezorAddresses(curAddress, numAddresses, hdNode);
    setHdNode(res.hdk);
    return res.wallets;
  }
  return { fetch };
}
