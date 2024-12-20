import { SafeInfoResponse } from '@safe-global/api-kit';
import { loadDataFromQuery, onLoadable } from '../../../../common/utils/query';
import { useSafeInfoQuery } from '../../../../features/safe/queries';
import { IWallet } from '../../../../graphql/client/generated/graphql';
import { EditOperation, EditSignersContent } from './content';

interface EditSignersQueryProps {
  wallet: IWallet;
  operation: EditOperation;
  onAddSigner: (
    safeInfo: SafeInfoResponse,
    address: string,
    threshold: number,
  ) => Promise<void>;
  onRemoveSigner: (
    safeInfo: SafeInfoResponse,
    address: string,
    threshold: number,
  ) => Promise<void>;
  onSwapSigner: (
    safeInfo: SafeInfoResponse,
    oldAddress: string,
    newAddress: string,
  ) => Promise<void>;
  onChangeThreshold: (
    safeInfo: SafeInfoResponse,
    threshold: number,
  ) => Promise<void>;
  onClose: VoidFunction;
}

export function EditSignersWithQuery(props: EditSignersQueryProps) {
  const {
    wallet,
    operation,
    onAddSigner,
    onRemoveSigner,
    onSwapSigner,
    onChangeThreshold,
    onClose,
  } = props;

  const safeInfoQuery = useSafeInfoQuery(wallet.chainId, wallet.address, {
    staleTime: Infinity,
  });

  const safeInfo = loadDataFromQuery(safeInfoQuery);

  return onLoadable(safeInfo)(
    () => null,
    () => null,
    (data) => (
      <EditSignersContent
        operation={operation}
        safeInfo={data}
        onAddSigner={(address: string, threshold: number) =>
          onAddSigner(data, address, threshold)
        }
        onRemoveSigner={(address: string, threshold: number) =>
          onRemoveSigner(data, address, threshold)
        }
        onSwapSigner={(oldAddress: string, newAddress: string) =>
          onSwapSigner(data, oldAddress, newAddress)
        }
        onChangeThreshold={(threshold: number) =>
          onChangeThreshold(data, threshold)
        }
        onClose={onClose}
      />
    ),
  );
}
