import { keepPreviousData } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Defined, DefinedType, Loadable } from '../types';

// IMPORTANT: we assume that data is not undefined when isSuccess is true
export type QueryResult<TData extends DefinedType> = {
  data: TData | undefined;
  isPending: boolean;
  isSuccess: boolean;
};

// we need to use our only QueryOption type to avoid messing up the type
// infrerences
export type QueryOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number;
  refetchOnMount?: boolean | 'always';
  placeholderData?: typeof keepPreviousData;
  retry?: number | boolean;
};

export function loadDataFromQuery<TData extends DefinedType>(
  query: QueryResult<TData>,
): Loadable<TData>;

export function loadDataFromQuery<
  TData extends DefinedType,
  TReturn extends DefinedType,
>(
  query: QueryResult<TData>,
  extractor: (data: TData) => TReturn,
): Loadable<TReturn>;

export function loadDataFromQuery<
  TData extends DefinedType,
  TMapped extends DefinedType,
>(
  query: QueryResult<TData>,
  extractor?: (data: TData) => TMapped,
): Loadable<TData> | Loadable<TMapped> {
  const { data, isPending, isSuccess } = query;
  if (isSuccess && data !== undefined) {
    return extractor ? makeLoadable(extractor(data)) : makeLoadable(data);
  } else if (isPending) {
    return extractor
      ? makeLoadableLoading<TMapped>()
      : makeLoadableLoading<TData>();
  } else {
    return extractor
      ? makeLoadableError<TMapped>()
      : makeLoadableError<TData>();
  }
}

export function useLoadDataFromQuery<TData extends DefinedType>(
  query: QueryResult<TData>,
): Loadable<TData>;

export function useLoadDataFromQuery<
  TData extends DefinedType,
  TReturn extends DefinedType,
>(
  query: QueryResult<TData>,
  extractor: (data: TData) => TReturn,
  deps?: React.DependencyList,
): Loadable<TReturn>;

export function useLoadDataFromQuery<
  TData extends DefinedType,
  TMapped extends DefinedType,
>(
  query: QueryResult<TData>,
  extractor?: (data: TData) => TMapped,
  deps?: React.DependencyList,
): Loadable<TData> | Loadable<TMapped> {
  const loadable = loadDataFromQuery(query);
  return useMemo(
    () => (extractor ? mapLoadable(loadable)(extractor) : loadable),
    deps
      ? [...deps, ...spreadLoadable(loadable)]
      : [...spreadLoadable(loadable)],
  );
}

export const composeLoadables =
  <
    TData extends DefinedType,
    TLoadable extends Loadable<TData>,
    TList extends TLoadable[],
  >(
    ...loadables: TList
  ) =>
  <TComposed extends DefinedType>(
    compose: (
      ...data: {
        [Index in keyof TList]: Defined<TList[Index]['data']>;
      }
    ) => TComposed,
  ): Loadable<TComposed> =>
    mapLoadable(sequenceLoadables(loadables))((data) =>
      compose(...(data as any)),
    );

export const onLoadable =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  <TLoading, TError, TSuccess>(
    onLoading: () => TLoading,
    onError: () => TError,
    onSuccess: (data: TData) => TSuccess,
  ): TLoading | TError | TSuccess =>
    loadable.loading
      ? onLoading()
      : loadable.error
      ? onError()
      : onSuccess(loadable.data);

export const mapLoadable =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  <TMapped extends DefinedType>(
    map: (data: TData) => TMapped,
  ): Loadable<TMapped> => {
    if (loadable.success) {
      return makeLoadable(map(loadable.data));
    } else if (loadable.loading) {
      return makeLoadableLoading();
    } else {
      return makeLoadableError();
    }
  };

export const altLoadableError =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  <TMapped extends DefinedType>(
    alt: () => Loadable<TMapped>,
  ): Loadable<TMapped | TData> =>
    loadable.error ? alt() : loadable;

export const altCondLoadable =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  (
    cond: (data: TData) => boolean,
    alt: () => Loadable<TData>,
  ): Loadable<TData> =>
    loadable.error
      ? alt()
      : chainLoadable(loadable)((data) =>
          cond(data) ? alt() : makeLoadable(data),
        );

export const applyLoadable =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  <TReturn extends DefinedType>(
    f: Loadable<(data: TData) => TReturn>,
  ): Loadable<TReturn> => {
    if (loadable.success && f.success) {
      return makeLoadable(f.data(loadable.data));
    } else if (loadable.error || f.error) {
      return makeLoadableError();
    } else {
      return makeLoadableLoading();
    }
  };

export const chainLoadable =
  <TData extends DefinedType>(loadable: Loadable<TData>) =>
  <TReturn extends DefinedType>(
    f: (data: TData) => Loadable<TReturn>,
  ): Loadable<TReturn> => {
    if (loadable.success) {
      return f(loadable.data);
    } else if (loadable.error) {
      return makeLoadableError();
    } else {
      return makeLoadableLoading();
    }
  };

// TODO: generalize this to heterogeneous types
export const sequenceLoadables = <TData extends DefinedType>(
  traversable: Loadable<TData>[],
): Loadable<TData[]> =>
  traversable.length === 0
    ? makeLoadable([])
    : applyLoadable(sequenceLoadables(traversable.slice(1)))(
        mapLoadable(traversable[0]!)(append),
      );

export const makeLoadable = <TData extends DefinedType = never>(
  data: TData,
): Loadable<TData> => ({
  data,
  loading: false,
  error: false,
  success: true,
});

export const makeLoadableLoading = <
  TData extends DefinedType = never,
>(): Loadable<TData> => ({
  data: undefined,
  loading: true,
  error: false,
  success: false,
});

export const makeLoadableError = <
  TData extends DefinedType = never,
>(): Loadable<TData> => ({
  data: undefined,
  loading: false,
  error: true,
  success: false,
});

export const spreadLoadable = <TData extends DefinedType>(
  loadable: Loadable<TData>,
): [TData | undefined, boolean, boolean] => [
  loadable.data,
  loadable.loading,
  loadable.success,
];

export const loadableEq = <TData extends DefinedType>(
  l1: Loadable<TData>,
  l2: Loadable<TData>,
) =>
  (l1.success && l2.success && l1.data === l2.data) ||
  (l1.loading && l2.loading) ||
  (l1.error && l2.error);

export const firstWith =
  <TData extends DefinedType>(...loadables: Loadable<TData>[]) =>
  (f: (item: TData) => boolean) =>
    loadables.find((l) => l.success && f(l.data)) ||
    loadables.find((l) => l.loading) ||
    loadables[loadables.length - 1]!;

const append =
  <T>(item: T) =>
  (list: T[]) =>
    [item].concat(list);
