import { createContext, useContext, useMemo } from 'react';

interface IInjectionContext<T> {
  Injection: React.ComponentType<T>;
}

interface InjectionContextProps<T> {
  injection: React.ComponentType<T>;
  mutable?: boolean;
  children: React.ReactNode;
}

const InjectionContext = createContext<IInjectionContext<any>>({} as any);

export function InjectionContextProvider<T>(props: InjectionContextProps<T>) {
  const { injection, mutable = true, children } = props;

  const context = useMemo(
    () => ({
      Injection: injection,
    }),
    [mutable ? injection : undefined],
  );

  return (
    <InjectionContext.Provider value={context}>
      {children}
    </InjectionContext.Provider>
  );
}

export function useInjectionContext<T extends unknown>() {
  return useContext(InjectionContext) as IInjectionContext<T>;
}
