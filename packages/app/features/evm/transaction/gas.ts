import { TransactionParams } from '../../../common/types';
import { QueryOptions, loadDataFromQuery } from '../../../common/utils/query';
import {
  IFeeData,
  ITransactionEvents,
  IWallet,
  useFeeDataQuery,
  useTransactionSimulationQuery,
} from '../../../graphql/client/generated/graphql';
import { useEstimateGasLimitQuery } from '../../proposal/gas';
import { useNativeBalancesWithWalletsQuery } from '../../wallet/native-balance';

export function useTransactionGasQueries(
  transaction: TransactionParams,
  options?: QueryOptions,
) {
  const feeDataQuery = useFeeDataQuery(
    {
      input: {
        chainId: transaction.chainId,
        data: transaction.data,
      },
    },
    {
      ...options,
      refetchInterval: 1000 * 10,
    },
  );
  const feeData = loadDataFromQuery(
    feeDataQuery,
    (data) => data.feeData as IFeeData,
  );

  const gasLimitQuery = useEstimateGasLimitQuery(transaction, options);
  const gasLimit = loadDataFromQuery(gasLimitQuery, (data) => data.gasLimit);
  return { feeData, gasLimit };
}

export function usePreTransactionQueries(
  wallet: IWallet,
  transaction: {
    chainId: number;
    data: string;
    to: string;
    value: string;
  },
  options?: QueryOptions,
) {
  const [executor] = useNativeBalancesWithWalletsQuery(
    transaction.chainId,
    [{ ...wallet, hasKeyring: true }],
    options,
  );

  const { feeData, gasLimit } = useTransactionGasQueries(
    {
      chainId: transaction.chainId,
      from: wallet.address,
      to: transaction.to,
      data: transaction.data,
      value: transaction.value,
    },
    options,
  );

  const simulatedEventsQuery = useTransactionSimulationQuery({
    input: {
      walletId: wallet.id,
      chainId: transaction.chainId,
      data: transaction.data,
      to: transaction.to,
      value: transaction.value,
    },
  });
  const simulatedEvents = loadDataFromQuery(
    simulatedEventsQuery,
    (data) => data.transactionSimulation as ITransactionEvents,
  );

  return {
    executor,
    feeData,
    gasLimit,
    simulatedEvents,
  };
}
