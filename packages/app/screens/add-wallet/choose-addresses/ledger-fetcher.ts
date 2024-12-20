import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { useEffect, useState } from 'react';
import { LedgerPathType } from '../../../common/types';
import { getEvmLedgerAddresses } from '../../../features/keyring/ledger/evm';
import { getSvmLedgerAddresses } from '../../../features/keyring/ledger/svm';
import { getTvmLedgerAddresses } from '../../../features/keyring/ledger/tvm';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';

export function useLedgerFetcher(props: {
  blockchain: IBlockchainType;
  transport: Transport | undefined;
}) {
  const [transport, setTransport] = useState(props.transport);
  const getAddressFn =
    props.blockchain === IBlockchainType.Evm
      ? getEvmLedgerAddresses
      : props.blockchain === IBlockchainType.Svm
      ? getSvmLedgerAddresses
      : getTvmLedgerAddresses;

  useEffect(() => {
    return () => {
      transport?.close();
    };
  }, []);

  async function fetch(
    curAddress: number,
    numAddresses: number,
    pathType?: LedgerPathType,
  ) {
    try {
      let currentTransport = transport;
      if (!currentTransport) {
        currentTransport = await TransportWebHID.create();
        setTransport(currentTransport);
      }
      const newWallets = await getAddressFn(
        currentTransport,
        curAddress,
        numAddresses,
        pathType,
      );
      return newWallets;
    } catch (err) {
      transport?.close();
      setTransport(undefined);
      throw err;
    }
  }
  return { fetch };
}
