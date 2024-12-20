import { graphqlType } from '@nestwallet/app/graphql/types';
import { MutateOptions, UseMutationResult } from '@tanstack/react-query';
import { EventEmitter } from 'eventemitter3';
import _ from 'lodash';
import { useEffect } from 'react';
import { useNestWallet } from '../../provider/nestwallet';
import { NestWalletClientEvents } from '../api/nestwallet/types';
import { PromiseFunction } from '../types';

const REFETCHER_KEY = 'query_refetcher_event';

interface Refetchable {
  refetch: PromiseFunction<unknown>;
}

export function emitRefetchEvent(
  eventEmitter: EventEmitter<string, any>,
  entityType: graphqlType | graphqlType[],
) {
  eventEmitter.emit(REFETCHER_KEY, {
    type: getEntityTypes(entityType),
  });
}

export function useMutationEmitter<TData, TError, TVariables, TContext>(
  entityType: graphqlType | graphqlType[],
  mutationTuple: UseMutationResult<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { eventEmitter } = useNestWallet();
  const mutateAsyncWrapper = async (
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TContext>,
  ): Promise<TData> => {
    const result = await mutationTuple.mutateAsync(variables, options);
    // TODO: since many of our backend updates are event drive, this does not always have the most fresh data
    // For example, when we create/sign a proposal this might finish refetching before the notification has finished being created
    emitRefetchEvent(eventEmitter, entityType);
    return result;
  };
  return {
    ...mutationTuple,
    mutateAsync: mutateAsyncWrapper,
  };
}

export function useQueryRefetcher<TQuery extends Refetchable>(
  entityType: graphqlType | graphqlType[] | NestWalletClientEvents,
  queryResult: TQuery,
) {
  const { eventEmitter } = useNestWallet();
  useEffect(() => {
    const entityTypes = getEntityTypes(entityType);
    const handler = async (args: { type: graphqlType[] }) => {
      const { type } = args;
      if (type.some((t) => entityTypes.includes(t))) {
        await queryResult.refetch();
      }
    };
    eventEmitter.addListener(REFETCHER_KEY, handler);
    return () => {
      eventEmitter.removeListener(REFETCHER_KEY, handler);
    };
  }, [entityType, eventEmitter, queryResult]);
  return queryResult;
}

function getEntityTypes(
  entityType: graphqlType | graphqlType[] | NestWalletClientEvents,
): Array<graphqlType | NestWalletClientEvents> {
  if (_.isString(entityType)) {
    return [entityType];
  }
  return entityType;
}
