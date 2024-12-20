import { createContext, useContext } from 'react';
import { useQueryRefetcher } from '../common/hooks/query';
import { ExternalTransactionProposal } from '../common/types';
import { loadDataFromQuery, onLoadable } from '../common/utils/query';
import { ActivityIndicator } from '../components/activity-indicator';
import { View } from '../components/view';
import { resolveExternalTransactionProposal } from '../features/proposal/utils';
import {
  ITransactionProposal,
  ITransactionProposalType,
  useTransactionProposalQuery,
} from '../graphql/client/generated/graphql';
import { graphqlType } from '../graphql/types';

interface EoaTransactionProposalContext {
  transaction: ExternalTransactionProposal;
  isDapp: boolean;
}

interface EoaTransactionProposalContextProps {
  transactionId: string;
  transactionType: ITransactionProposalType;
  isDapp: boolean;
  children: React.ReactNode;
  loadingElement?: React.ReactNode;
  errorElement?: React.ReactNode;
}

const EoaTransactionProposalContext =
  createContext<EoaTransactionProposalContext>({} as any);

export function EoaTransactionProposalContextProvider(
  props: EoaTransactionProposalContextProps,
) {
  const {
    transactionId,
    transactionType,
    isDapp,
    loadingElement,
    errorElement,
  } = props;

  const transactionProposalQuery = useQueryRefetcher(
    graphqlType.PendingTransaction,
    useTransactionProposalQuery({
      input: {
        id: transactionId,
        type: transactionType,
      },
    }),
  );

  const eoaTransactionProposalContext = loadDataFromQuery(
    transactionProposalQuery,
    (data) => ({
      transaction: resolveExternalTransactionProposal(
        data.transactionProposal as ITransactionProposal,
      ),
      isDapp,
    }),
  );

  return onLoadable(eoaTransactionProposalContext)(
    () =>
      loadingElement ?? (
        <View className='flex h-full items-center justify-center'>
          <ActivityIndicator />
        </View>
      ),
    () => errorElement ?? null,
    (data) => (
      <EoaTransactionProposalContext.Provider value={data}>
        {props.children}
      </EoaTransactionProposalContext.Provider>
    ),
  );
}

export function useEoaTransactionProposalContext() {
  return useContext(EoaTransactionProposalContext);
}
