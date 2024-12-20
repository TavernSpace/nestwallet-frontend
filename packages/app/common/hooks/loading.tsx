import {
  EffectCallback,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DefinedType, Loadable } from '../types';
import {
  makeLoadable,
  makeLoadableError,
  makeLoadableLoading,
  spreadLoadable,
} from '../utils/query';

export function useEffectOnInitialSuccess<TData extends DefinedType>(
  loadable: Loadable<TData>,
  effect: (data: TData) => void,
) {
  const isExecuted = useRef(false);
  useEffect(() => {
    if (loadable.success && !isExecuted.current) {
      effect(loadable.data);
      isExecuted.current = true;
    }
  }, [...spreadLoadable(loadable)]);
}

export function useEffectOnSuccess<TData extends DefinedType>(
  loadable: Loadable<TData>,
  effect: (data: TData) => ReturnType<EffectCallback>,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    if (loadable.success) {
      return effect(loadable.data);
    }
  }, [...spreadLoadable(loadable), ...deps]);
}

export function useEffectOnError<TData extends DefinedType>(
  loadable: Loadable<TData>,
  effect: () => ReturnType<EffectCallback>,
) {
  useEffect(() => {
    if (loadable.error) {
      return effect();
    }
  }, [...spreadLoadable(loadable)]);
}

export const useLoadFunction = <TData extends DefinedType>(
  f: () => Promise<Awaited<TData>>,
  disabled?: boolean,
): {
  data: Loadable<TData>;
  refetch: (clearOldData?: boolean) => Promise<void>;
} => {
  const [result, setResult] = useState<Loadable<TData>>(makeLoadableLoading());

  const loadFunction = async () =>
    f()
      .then((res) => setResult(makeLoadable(res)))
      .catch(() => setResult(makeLoadableError()));

  const refetch = useCallback(
    async (clearOldData?: boolean) => {
      if (clearOldData) {
        setResult(makeLoadableLoading());
      }
      await loadFunction();
    },
    [f],
  );

  useEffect(() => {
    if (!disabled) {
      loadFunction();
    }
  }, [f, disabled]);

  return { data: result, refetch };
};
