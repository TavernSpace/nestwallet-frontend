import { useQueryClient } from '@tanstack/react-query';
import EventEmitter from 'eventemitter3';
import { uniqBy } from 'lodash';
import { DateTime } from 'luxon';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  getLifiStatus,
  lifiStatusToBridgeStatus,
} from '../common/api/lifi/utils';
import { delay } from '../common/api/utils';
import { emitRefetchEvent } from '../common/hooks/query';
import { ChainId } from '../features/chain';
import { parseError } from '../features/errors';
import { historyInfiniteQueryKey } from '../features/history/query';
import {
  isSafeTransactionProposalComplete,
  onTransactionProposal,
  resolveExternalTransactionProposal,
  tagEthKeyTransactionProposal,
  tagSafeTransactionProposal,
  tagSvmKeyTransactionProposal,
  tagTvmKeyTransactionProposal,
} from '../features/proposal/utils';
import { safeInfoQueryKey } from '../features/safe/queries';
import { convertToLifiChainId } from '../features/swap/lifi/utils';
import {
  IBridgeStatus,
  IEthKeyTransactionProposal,
  IProposalState,
  ISafeTransactionProposal,
  ISvmKeyTransactionProposal,
  ITransactionMetaType,
  ITransactionProposal,
  ITransactionProposalType,
  ITransactionStatus,
  ITvmKeyTransactionProposal,
  useVerifyTransactionProposalMutation,
} from '../graphql/client/generated/graphql';
import { graphqlType } from '../graphql/types';
import { useNestWallet } from './nestwallet';

type ExecutionEventType =
  | 'initialize'
  | 'fail'
  | 'drop'
  | 'success'
  | 'removal'
  | 'bridge';

interface ExecutionEvent {
  type: ExecutionEventType;
  chainId: number;
}

type ExecutionData<T> = {
  time: number;
  attempts: number;
  data: T;
};

function makeExecutionData<T>(data: T, attempts = 0): ExecutionData<T> {
  return {
    time: DateTime.now().toUnixInteger(),
    attempts,
    data,
  };
}

function updateExecutionData<T>(
  data: ExecutionData<T>,
  newData: T,
): ExecutionData<T> {
  return {
    time: DateTime.now().toUnixInteger(),
    attempts: data.attempts + 1,
    data: newData,
  };
}

function extractData<T, V>(
  data: Record<string, ExecutionData<T>>,
  map: (item: T) => V,
  cond: (data: ExecutionData<T>) => boolean,
): V[] {
  return Object.values(data)
    .filter(cond)
    .map((data) => map(data.data));
}

interface IVerifyExecutionContext {
  verifyTransactionProposals: (...proposals: ITransactionProposal[]) => void;
  stopVerifyingTransactionProposals: (
    ...proposals: ITransactionProposal[]
  ) => void;
  isVerifyingTransactionProposal: (proposal: ITransactionProposal) => boolean;
  isPostProcessingTransactionProposal: (
    proposal: ITransactionProposal,
  ) => boolean;
  trackedTransactionProposals: () => ITransactionProposal[];
  subscribe: (f: (event: ExecutionEvent) => void) => VoidFunction;
}

interface VerifyExecutionContextProps {
  children: React.ReactNode;
}

export const VerifyExecutionContext = createContext<IVerifyExecutionContext>(
  {} as any,
);

// Since there are many places an executing proposal can be, we do the refetching logic
// in a centralized provider to avoid duplicate calls
export function VerifyExecutionContextProvider(
  props: VerifyExecutionContextProps,
) {
  const { eventEmitter } = useNestWallet();
  const queryClient = useQueryClient();
  const eventRef = useRef(new EventEmitter());
  const eventKey = 'PENDING_TX_CHANGED';
  const dismissedRef = useRef<Record<string, boolean>>({});
  const executingSafeTransactionProposals = useRef<
    Record<string, ExecutionData<ISafeTransactionProposal>>
  >({});
  const executingEthKeyTransactionProposals = useRef<
    Record<string, ExecutionData<IEthKeyTransactionProposal>>
  >({});
  const executingSvmKeyTransactionProposals = useRef<
    Record<string, ExecutionData<ISvmKeyTransactionProposal>>
  >({});
  const executingTvmKeyTransactionProposals = useRef<
    Record<string, ExecutionData<ITvmKeyTransactionProposal>>
  >({});
  const bridgingTransactionProposals = useRef<
    Record<string, ExecutionData<ITransactionProposal>>
  >({});
  const verifyTransactionProposalMutation =
    useVerifyTransactionProposalMutation();

  const emitExecutionEvent = (type: ExecutionEvent) => {
    eventRef.current.emit(eventKey, type);
  };

  const emit = (type: ExecutionEvent) => {
    emitRefetchEvent(eventEmitter, graphqlType.PendingTransaction);
    emitExecutionEvent(type);
  };

  const verifyTransactionProposals = useCallback(
    (...transactionProposals: ITransactionProposal[]) => {
      transactionProposals.forEach((transactionProposal) =>
        onTransactionProposal(transactionProposal)(
          (proposal) => {
            if (
              proposal.txHash &&
              !executingSafeTransactionProposals.current[proposal.id]
            ) {
              executingSafeTransactionProposals.current[proposal.id] =
                makeExecutionData(proposal);
            }
          },
          (proposal) => {
            if (
              proposal.bridgeStatus &&
              !bridgingTransactionProposals.current[proposal.id]
            ) {
              bridgingTransactionProposals.current[proposal.id] =
                makeExecutionData(transactionProposal);
            }
            if (
              proposal.txHash &&
              !executingEthKeyTransactionProposals.current[proposal.id]
            ) {
              executingEthKeyTransactionProposals.current[proposal.id] =
                makeExecutionData(proposal);
            }
          },
          (proposal) => {
            if (
              proposal.bridgeStatus &&
              !bridgingTransactionProposals.current[proposal.id]
            ) {
              bridgingTransactionProposals.current[proposal.id] =
                makeExecutionData(transactionProposal);
            }
            if (
              proposal.txHash &&
              !executingSvmKeyTransactionProposals.current[proposal.id]
            ) {
              executingSvmKeyTransactionProposals.current[proposal.id] =
                makeExecutionData(proposal);
            }
          },
          (proposal) => {
            if (
              proposal.txHash &&
              !executingTvmKeyTransactionProposals.current[proposal.id]
            ) {
              executingTvmKeyTransactionProposals.current[proposal.id] =
                makeExecutionData(proposal);
            }
          },
        ),
      );
      emitExecutionEvent({ type: 'initialize', chainId: 0 });
    },
    [],
  );

  const stopVerifyingTransactionProposals = useCallback(
    (...proposals: ITransactionProposal[]) => {
      proposals.forEach((proposal) => {
        dismissedRef.current[proposal.id] = true;
        return onTransactionProposal(proposal)(
          () => delete executingSafeTransactionProposals.current[proposal.id],
          () => {
            delete executingEthKeyTransactionProposals.current[proposal.id];
          },
          () => {
            delete executingSvmKeyTransactionProposals.current[proposal.id];
          },
          () => delete executingTvmKeyTransactionProposals.current[proposal.id],
        );
      });
    },
    [],
  );

  const isVerifyingTransactionProposal = useCallback(
    (proposal: ITransactionProposal) =>
      onTransactionProposal(proposal)(
        () => !!executingSafeTransactionProposals.current[proposal.id],
        () =>
          !!executingEthKeyTransactionProposals.current[proposal.id] ||
          !!bridgingTransactionProposals.current[proposal.id],
        () =>
          !!executingSvmKeyTransactionProposals.current[proposal.id] ||
          !!bridgingTransactionProposals.current[proposal.id],
        () => !!executingTvmKeyTransactionProposals.current[proposal.id],
      ),
    [],
  );

  const isPostProcessingTransactionProposal = useCallback(
    (proposal: ITransactionProposal) =>
      !!bridgingTransactionProposals.current[proposal.id],
    [],
  );

  const trackedTransactionProposals = useCallback(() => {
    const condition = <
      TData extends
        | IEthKeyTransactionProposal
        | ISvmKeyTransactionProposal
        | ITvmKeyTransactionProposal,
    >(
      data: ExecutionData<TData>,
    ) => {
      return (
        data.data.status === ITransactionStatus.Pending || data.attempts > 0
      );
    };
    return uniqBy(
      [
        ...extractData(
          executingEthKeyTransactionProposals.current,
          tagEthKeyTransactionProposal,
          condition,
        ),
        ...extractData(
          executingSvmKeyTransactionProposals.current,
          tagSvmKeyTransactionProposal,
          condition,
        ),
        ...extractData(
          executingTvmKeyTransactionProposals.current,
          tagTvmKeyTransactionProposal,
          condition,
        ),
      ].filter((tx) => !dismissedRef.current[tx.id]),
      (tx) => tx.id,
    ).sort((t0, t1) => {
      const now = DateTime.now();
      const t0External = resolveExternalTransactionProposal(t0);
      const t1External = resolveExternalTransactionProposal(t1);
      const t0Time = t0External.submittedAt
        ? DateTime.fromISO(t0External.submittedAt)
        : now;
      const t1Time = t1External.submittedAt
        ? DateTime.fromISO(t1External.submittedAt)
        : now;
      return t1Time.toUnixInteger() - t0Time.toUnixInteger();
    });
  }, []);

  const subscribe = useCallback((f: (event: ExecutionEvent) => void) => {
    eventRef.current.on(eventKey, f);
    return () => eventRef.current.off(eventKey, f);
  }, []);

  const handleExecutedSafeTransactionProposal = async (
    proposal: ISafeTransactionProposal,
  ) => {
    const currentProposal =
      executingSafeTransactionProposals.current[proposal.id];
    if (currentProposal) {
      executingSafeTransactionProposals.current[proposal.id] =
        updateExecutionData(currentProposal, proposal);
    } else {
      executingSafeTransactionProposals.current[proposal.id] =
        makeExecutionData(proposal, 1);
    }
    // after a proposal which targets the safe is executed, we need to update the safeInfo because the proposal might have updated the safe signers
    // its important to refetch this way instead of calling refetch because refetch will refetch every current instance of
    // safe info, which can be very large if the user has many proposals/messages
    if (isSafeTransactionProposalComplete(proposal)) {
      // delay to give the safe api some time to update
      await delay(3000);
      queryClient.invalidateQueries({
        queryKey: safeInfoQueryKey(proposal.chainId, proposal.wallet.address),
      });
      queryClient.invalidateQueries({
        queryKey: historyInfiniteQueryKey(proposal.wallet.id, undefined).slice(
          0,
          1,
        ),
      });
    }
    if (proposal.state !== IProposalState.Executing) {
      queryClient.invalidateQueries({ queryKey: ['TransactionProposal'] });
      queryClient.invalidateQueries({ queryKey: ['TransactionProposals'] });
    }
  };

  const handleExecutedEthKeyTransactionProposal = async (
    transaction: IEthKeyTransactionProposal,
  ) => {
    const currentTransaction =
      executingEthKeyTransactionProposals.current[transaction.id];
    if (currentTransaction) {
      executingEthKeyTransactionProposals.current[transaction.id] =
        updateExecutionData(currentTransaction, transaction);
    } else {
      executingEthKeyTransactionProposals.current[transaction.id] =
        makeExecutionData(transaction, 1);
    }
    if (
      transaction.status === ITransactionStatus.Confirmed ||
      transaction.status === ITransactionStatus.Failed
    ) {
      // delay to give zerion some time to update
      await delay(3000);
      queryClient.invalidateQueries({
        queryKey: historyInfiniteQueryKey(
          transaction.wallet.id,
          undefined,
        ).slice(0, 1),
      });
    }
    if (transaction.status !== ITransactionStatus.Pending) {
      emit({
        type:
          transaction.status === ITransactionStatus.Failed
            ? 'fail'
            : transaction.status === ITransactionStatus.Dropped
            ? 'drop'
            : 'success',
        chainId: transaction.chainId,
      });
    }
  };

  const handleExecutedSvmKeyTransactionProposal = async (
    transaction: ISvmKeyTransactionProposal,
  ) => {
    const currentTransaction =
      executingSvmKeyTransactionProposals.current[transaction.id];
    if (currentTransaction) {
      executingSvmKeyTransactionProposals.current[transaction.id] =
        updateExecutionData(currentTransaction, transaction);
    } else {
      executingSvmKeyTransactionProposals.current[transaction.id] =
        makeExecutionData(transaction, 1);
    }
    if (
      transaction.status === ITransactionStatus.Confirmed ||
      transaction.status === ITransactionStatus.Failed
    ) {
      await delay(3000);
      queryClient.invalidateQueries({
        queryKey: historyInfiniteQueryKey(
          transaction.wallet.id,
          undefined,
        ).slice(0, 1),
      });
    }
    if (transaction.status !== ITransactionStatus.Pending) {
      emit({
        type:
          transaction.status === ITransactionStatus.Failed
            ? 'fail'
            : transaction.status === ITransactionStatus.Dropped
            ? 'drop'
            : 'success',
        chainId: transaction.chainId,
      });
    }
  };

  const handleExecutedTvmKeyTransactionProposal = async (
    transaction: ITvmKeyTransactionProposal,
  ) => {
    const currentTransaction =
      executingTvmKeyTransactionProposals.current[transaction.id];
    if (currentTransaction) {
      executingTvmKeyTransactionProposals.current[transaction.id] =
        updateExecutionData(currentTransaction, transaction);
    } else {
      executingTvmKeyTransactionProposals.current[transaction.id] =
        makeExecutionData(transaction, 1);
    }
    if (
      transaction.status === ITransactionStatus.Confirmed ||
      transaction.status === ITransactionStatus.Failed
    ) {
      await delay(3000);
      queryClient.invalidateQueries({
        queryKey: historyInfiniteQueryKey(
          transaction.wallet.id,
          undefined,
        ).slice(0, 1),
      });
    }
    if (transaction.status !== ITransactionStatus.Pending) {
      emit({
        type:
          transaction.status === ITransactionStatus.Failed
            ? 'fail'
            : transaction.status === ITransactionStatus.Dropped
            ? 'drop'
            : 'success',
        chainId: transaction.chainId,
      });
    }
  };

  const handleExecutedTransactionProposal = async (
    proposal: ITransactionProposal,
  ) =>
    onTransactionProposal(proposal)(
      (proposal) => handleExecutedSafeTransactionProposal(proposal),
      (proposal) => handleExecutedEthKeyTransactionProposal(proposal),
      (proposal) => handleExecutedSvmKeyTransactionProposal(proposal),
      (proposal) => handleExecutedTvmKeyTransactionProposal(proposal),
    );

  useEffect(() => {
    // TODO: should we periodically pull if proposal is reverted?
    const verifyAllTransactionProposals = async () => {
      const time = DateTime.now().toUnixInteger();
      const maxDuration = 5;

      const safeProposals = Object.values(
        executingSafeTransactionProposals.current,
      );
      const safeToVerify = safeProposals
        .filter(
          (proposal) =>
            proposal.data.state === IProposalState.Executing &&
            !!proposal.data.txHash &&
            time - proposal.time >=
              Math.min(maxDuration, proposal.attempts * 2),
        )
        .map((proposal): [ITransactionProposal, number] => [
          tagSafeTransactionProposal(proposal.data),
          proposal.attempts,
        ]);
      const safeToDelete = safeProposals.filter(
        (proposal) =>
          proposal.data.state === IProposalState.Executed &&
          time - proposal.time > 6,
      );

      const validFilter = (
        proposal: ExecutionData<
          | IEthKeyTransactionProposal
          | ISvmKeyTransactionProposal
          | ITvmKeyTransactionProposal
        >,
      ) => {
        const validTime =
          proposal.data.chainId === ChainId.Ethereum ||
          proposal.data.chainId === ChainId.Ton
            ? time - proposal.time >= 4
            : true;
        return (
          proposal.data.status === ITransactionStatus.Pending &&
          !!proposal.data.txHash &&
          validTime
        );
      };

      const ethKeyProposals = Object.values(
        executingEthKeyTransactionProposals.current,
      );
      const ethKeyToVerify = ethKeyProposals
        .filter(validFilter)
        .map((proposal): [ITransactionProposal, number] => [
          tagEthKeyTransactionProposal(proposal.data),
          proposal.attempts,
        ]);
      const ethKeyToDelete = ethKeyProposals.filter(
        (proposal) =>
          proposal.data.status === ITransactionStatus.Confirmed &&
          time - proposal.time > 6,
      );

      const svmKeyProposals = Object.values(
        executingSvmKeyTransactionProposals.current,
      );
      const svmKeyToVerify = svmKeyProposals
        .filter(validFilter)
        .map((proposal): [ITransactionProposal, number] => [
          tagSvmKeyTransactionProposal(proposal.data),
          proposal.attempts,
        ]);
      const svmKeyToDelete = svmKeyProposals.filter(
        (proposal) =>
          proposal.data.status === ITransactionStatus.Confirmed &&
          time - proposal.time > 6,
      );

      const tvmKeyProposals = Object.values(
        executingTvmKeyTransactionProposals.current,
      );
      const tvmKeyToVerify = Object.values(
        executingTvmKeyTransactionProposals.current,
      )
        .filter(validFilter)
        .map((proposal): [ITransactionProposal, number] => [
          tagTvmKeyTransactionProposal(proposal.data),
          proposal.attempts,
        ]);
      const tvmKeyToDelete = tvmKeyProposals.filter(
        (proposal) =>
          proposal.data.status === ITransactionStatus.Confirmed &&
          time - proposal.time > 6,
      );

      const verifyTx = async (id: string, type: ITransactionProposalType) => {
        await verifyTransactionProposalMutation
          .mutateAsync({
            input: {
              id,
              type,
            },
          })
          .then((result) => {
            handleExecutedTransactionProposal(
              result.verifyTransactionProposal as ITransactionProposal,
            );
          })
          .catch((err) => {
            const error = parseError(err);
            if (error.message === 'proposal not found') {
              stopVerifyingTransactionProposals({
                id,
                type,
              } as ITransactionProposal);
              emit({ type: 'removal', chainId: 0 });
            }
          });
      };

      const mutations = [
        ...safeToVerify,
        ...ethKeyToVerify,
        ...svmKeyToVerify,
        ...tvmKeyToVerify,
      ].map(([proposal, attempts]) => verifyTx(proposal.id, proposal.type));

      // Completed transactions which no longer need to be tracked
      // TODO: for dropped and failed how to we prevent infinite growth?
      const deletions = [
        ...safeToDelete.map((tx) => tagSafeTransactionProposal(tx.data)),
        ...ethKeyToDelete.map((tx) => tagEthKeyTransactionProposal(tx.data)),
        ...svmKeyToDelete.map((tx) => tagSvmKeyTransactionProposal(tx.data)),
        ...tvmKeyToDelete.map((tx) => tagTvmKeyTransactionProposal(tx.data)),
      ];
      if (deletions.length > 0) {
        stopVerifyingTransactionProposals(...deletions);
        emitExecutionEvent({ type: 'removal', chainId: 0 });
      }

      return Promise.all(mutations).catch(() => {});
    };

    const verifyBridgedTransactionProposals = async () => {
      const isPending = (tx: ITransactionProposal, full: boolean) => {
        const proposal = resolveExternalTransactionProposal(tx);
        const bridgeStatus = proposal.bridgeStatus;
        const isInitialReady =
          proposal.status === ITransactionStatus.Confirmed && !!proposal.txHash;
        if (!bridgeStatus || (full && !isInitialReady)) {
          return false;
        } else {
          return (
            bridgeStatus === IBridgeStatus.NotInitiated ||
            bridgeStatus === IBridgeStatus.WaitDestinationConfirm ||
            bridgeStatus === IBridgeStatus.WaitSourceConfirm ||
            bridgeStatus === IBridgeStatus.Refunding
          );
        }
      };
      const bridgingProposals = Object.values(
        bridgingTransactionProposals.current,
      );
      const bridgingToVerify = bridgingProposals.filter((proposal) =>
        isPending(proposal.data, true),
      );
      const bridgingToDelete = bridgingProposals.filter(
        (proposal) => !isPending(proposal.data, false),
      );
      const mutations = bridgingToVerify.map(async (tx) => {
        const proposal = resolveExternalTransactionProposal(tx.data);
        // Note: we need to use the api directly instead of the sdk here
        // since the sdk automatically caches this request
        const bridgeMetadata = proposal.metadata?.find(
          (data) => data.type === ITransactionMetaType.Bridge,
        )?.bridge;
        const status = await getLifiStatus({
          txHash: proposal.txHash!,
          fromChain: convertToLifiChainId(proposal.chainId),
          toChain: convertToLifiChainId(
            bridgeMetadata?.toChainId ?? proposal.bridgeData!.chainId,
          ),
        });
        const bridgeStatus = lifiStatusToBridgeStatus(
          status.status,
          status.substatus,
        );
        if (bridgeStatus !== proposal.bridgeStatus) {
          await verifyTransactionProposalMutation
            .mutateAsync({
              input: {
                id: proposal.id,
                type: tx.data.type,
                bridgeStatus,
              },
            })
            .then((result) => {
              const resolved = resolveExternalTransactionProposal(
                result.verifyTransactionProposal as ITransactionProposal,
              );
              const bridgeMetadata = resolved.metadata?.find(
                (data) => data.type === ITransactionMetaType.Bridge,
              )?.bridge;
              if (
                resolved.bridgeData?.expectedRecipientAddress ===
                  proposal.wallet.address ||
                bridgeMetadata?.recipientAddress === proposal.wallet.address
              ) {
                queryClient.invalidateQueries({
                  queryKey: historyInfiniteQueryKey(
                    proposal.wallet.id,
                    undefined,
                  ).slice(0, 1),
                });
              }
              bridgingTransactionProposals.current[
                result.verifyTransactionProposal.id
              ] = makeExecutionData(
                result.verifyTransactionProposal as ITransactionProposal,
              );
              if (resolved.bridgeStatus !== proposal.bridgeStatus) {
                emit({ type: 'bridge', chainId: resolved.chainId });
              }
            })
            .catch(() => {});
        }
      });
      return Promise.all(mutations).catch(() => {});
    };

    const interval = setInterval(verifyAllTransactionProposals, 2000);
    const bridgeInterval = setInterval(verifyBridgedTransactionProposals, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(bridgeInterval);
      eventRef.current.removeAllListeners();
    };
  }, []);

  const verifyExecutionContext: IVerifyExecutionContext = useMemo(
    () => ({
      verifyTransactionProposals,
      stopVerifyingTransactionProposals,
      isVerifyingTransactionProposal,
      isPostProcessingTransactionProposal,
      trackedTransactionProposals,
      subscribe,
    }),
    [],
  );

  return (
    <VerifyExecutionContext.Provider value={verifyExecutionContext}>
      {props.children}
    </VerifyExecutionContext.Provider>
  );
}

export function useVerifyExecutionContext() {
  return useContext(VerifyExecutionContext);
}
