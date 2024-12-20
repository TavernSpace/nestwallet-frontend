import { createContext, useContext, useMemo, useState } from 'react';

interface IDataContext<T> {
  data: T;
  modifyData: (data: T) => void;
}

export const DataContext = createContext<IDataContext<any>>({} as any);

export function DataContextProvider<T extends unknown>(props: {
  defaultValue: T;
  children: React.ReactNode;
}) {
  const { defaultValue, children } = props;

  const [data, setData] = useState<T>(defaultValue);

  const context: IDataContext<T> = useMemo(
    () => ({
      data,
      modifyData: (data: T) => setData(data),
    }),
    [data],
  );

  return (
    <DataContext.Provider value={context}>{children}</DataContext.Provider>
  );
}

export function useDataContext<T extends unknown>() {
  return useContext(DataContext) as IDataContext<T>;
}
