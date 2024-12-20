import { SafeInfoResponse } from '@safe-global/api-kit';
import { createContext, useContext, useEffect } from 'react';
import { useQueryRefetcher } from '../common/hooks/query';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
  Loadable,
  SafeNonceData,
} from '../common/types';
import {
  composeLoadables,
  loadDataFromQuery,
  mapLoadable,
  onLoadable,
} from '../common/utils/query';
import { ActivityIndicator } from '../components/activity-indicator';
import { View } from '../components/view';
import { useSafeNonceDataQuery } from '../features/proposal/nonce';
import {
  isSafeTransactionProposalComplete,
  tagSafeTransactionProposal,
} from '../features/proposal/utils';
import { useSafeInfoQuery } from '../features/safe/queries';
import {
  SafeTxState,
  getSafeTxStateFromSafeTransactionProposal,
  isSafeTransactionProposalExecuting,
} from '../features/safe/utils';
import { useNativeBalancesWithWalletsQuery } from '../features/wallet/native-balance';
import { getValidSigners } from '../features/wallet/utils';
import {
  IBlockchainType,
  IContact,
  ISafeTransactionProposal,
  ITransactionProposalType,
  useContactsQuery,
  useTransactionProposalQuery,
} from '../graphql/client/generated/graphql';
import { graphqlType } from '../graphql/types';
import { useVerifyExecutionContext } from './verify-execution';

interface ISafeTransactionProposalContext {
  proposal: ISafeTransactionProposal;
  safeInfo: Loadable<SafeInfoResponse>;
  nonceData: Loadable<SafeNonceData>;
  contacts: Loadable<IContact[]>;
  executors: IWalletWithLoadableBalance[];
  isDapp: boolean;
}

interface SafeTransactionProposalContextProps {
  proposalId: string;
  isDapp: boolean;
  signers: ISignerWallet[];
  children: React.ReactNode;
  loadingElement?: React.ReactNode;
  errorElement?: React.ReactNode;
}

const SafeTransactionProposalContext =
  createContext<ISafeTransactionProposalContext>({} as any);

export function SafeTransactionProposalContextProvider(
  props: SafeTransactionProposalContextProps,
) {
  const { proposalId, loadingElement, errorElement } = props;

  const transactionProposalQuery = useQueryRefetcher(
    graphqlType.Proposal,
    useTransactionProposalQuery(
      { input: { id: proposalId, type: ITransactionProposalType.Safe } },
      {
        refetchInterval: (query) => {
          const proposal = query.state.data?.transactionProposal.safe as
            | ISafeTransactionProposal
            | undefined;
          return proposal &&
            (isSafeTransactionProposalComplete(proposal) ||
              isSafeTransactionProposalExecuting(proposal))
            ? false
            : 5 * 1000;
        },
      },
    ),
  );

  const safeTransactionProposal = loadDataFromQuery(
    transactionProposalQuery,
    (data) => data.transactionProposal.safe! as ISafeTransactionProposal,
  );

  return onLoadable(safeTransactionProposal)(
    () =>
      loadingElement ?? (
        <View className='flex h-full items-center justify-center'>
          <ActivityIndicator />
        </View>
      ),
    () => errorElement ?? null,
    (data) => (
      <SafeTransactionProposalContextWithProposal {...props} proposal={data} />
    ),
  );
}

type SafeTransactionProposalContextWithSafeInfoProps =
  SafeTransactionProposalContextProps & {
    proposal: ISafeTransactionProposal;
    signers: ISignerWallet[];
  };

function SafeTransactionProposalContextWithProposal(
  props: SafeTransactionProposalContextWithSafeInfoProps,
) {
  const { proposal, signers, isDapp } = props;
  const { verifyTransactionProposals, isVerifyingTransactionProposal } =
    useVerifyExecutionContext();

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: proposal.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const safeInfoQuery = useSafeInfoQuery(
    proposal.chainId,
    proposal.wallet.address,
  );
  const safeInfo = loadDataFromQuery(safeInfoQuery);

  const nonceDataQuery = useSafeNonceDataQuery(
    proposal.wallet.id,
    safeInfo.data?.nonce ?? 0,
    { staleTime: Infinity },
  );
  const nonceData = composeLoadables(
    safeInfo,
    loadDataFromQuery(nonceDataQuery),
  )((_, nonceData) => nonceData);

  const isExecutable = mapLoadable(safeInfo)((safeInfo) => {
    const state = getSafeTxStateFromSafeTransactionProposal(safeInfo, proposal);
    return (
      state === SafeTxState.ReadyToExecute || state === SafeTxState.Executing
    );
  });

  const validSigners = getValidSigners(signers, IBlockchainType.Evm);
  const executors = useNativeBalancesWithWalletsQuery(
    proposal.chainId,
    proposal.isRelayed
      ? [...validSigners, { ...proposal.wallet, hasKeyring: false }]
      : validSigners,
    { enabled: !!isExecutable.data },
  );

  useEffect(() => {
    const taggedProposal = tagSafeTransactionProposal(proposal);
    if (!isVerifyingTransactionProposal(taggedProposal)) {
      verifyTransactionProposals(taggedProposal);
    }
  }, [proposal]);

  const proposalContext: ISafeTransactionProposalContext = {
    proposal,
    safeInfo,
    nonceData,
    contacts,
    isDapp,
    executors,
  };

  return (
    <SafeTransactionProposalContext.Provider value={proposalContext}>
      {props.children}
    </SafeTransactionProposalContext.Provider>
  );
}

export function useSafeTransactionProposalContext() {
  return useContext(SafeTransactionProposalContext);
}
