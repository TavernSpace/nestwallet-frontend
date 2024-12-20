import { useMemo } from 'react';
import { QueryOptions } from '../../common/utils/query';
import {
  ISafeTransactionProposal,
  ITransactionSimulationInput,
  useTransactionSimulationQuery,
} from '../../graphql/client/generated/graphql';

export function useSimulateSafeTransactionProposal(
  proposal: ISafeTransactionProposal,
  options?: QueryOptions,
) {
  const simulationInput: ITransactionSimulationInput = useMemo(() => {
    return {
      chainId: proposal.chainId,
      walletId: proposal.wallet.id,
      to: proposal.toAddress,
      value: proposal.value,
      data: proposal.data,
      operation: proposal.operation,
      gasPrice: proposal.gasPrice,
      gasToken: proposal.gasToken,
      baseGas: proposal.baseGas,
      refundReceiver: proposal.refundReceiver,
      safeTxGas: proposal.safeTxGas,
    };
  }, [proposal]);
  return useTransactionSimulationQuery({ input: simulationInput }, options);
}
