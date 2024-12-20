import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { v4 } from 'uuid';
import { Loadable, Preferences } from '../common/types';
import { useSafeAreaInsets } from '../features/safe-area';
import { ITransactionStatus } from '../graphql/client/generated/graphql';
import {
  ExpandType,
  PendingTransactionBanner,
} from '../molecules/transaction/pending';
import { useAudioContext } from './audio';

interface IExecutionContext {
  expand: (status: ITransactionStatus) => void;
  constrain: (value: number) => void;
  subscribe: (f: (chainId: number) => void) => VoidFunction;
}

export const ExecutionContext = createContext<IExecutionContext>({} as any);

export function ExecutionContextProvider(props: {
  preferences: Loadable<Preferences>;
  children: React.ReactNode;
}) {
  const { preferences, children } = props;
  const { sounds } = useAudioContext();
  const { bottom } = useSafeAreaInsets();

  const [collapsed, setCollapsed] = useState(true);
  const [expandType, setExpandType] = useState<ExpandType>({});
  const [bottomPadding, setBottomPadding] = useState(bottom);

  const subscriptionRef = useRef<Record<string, (chainId: number) => void>>({});

  const handleCollapse = useCallback((collapsed: boolean) => {
    setCollapsed(collapsed);
  }, []);

  const handleExpand = useCallback((expand: ITransactionStatus | undefined) => {
    setExpandType({ status: expand });
  }, []);

  const handleComplete = useCallback((chainId: number) => {
    Object.values(subscriptionRef.current).forEach((sub) => {
      sub(chainId);
    });
  }, []);

  const context: IExecutionContext = useMemo(
    () => ({
      expand: (status) => {
        handleExpand(status);
        if (status === ITransactionStatus.Pending) {
          sounds.confirmSound2?.replayAsync();
        }
      },
      constrain: (value) => {
        setBottomPadding(value);
      },
      subscribe: (f) => {
        const id = v4();
        subscriptionRef.current[id] = f;
        return () => {
          delete subscriptionRef.current[id];
        };
      },
    }),
    [sounds],
  );

  return (
    <ExecutionContext.Provider value={context}>
      {children}
      <PendingTransactionBanner
        collapsed={collapsed}
        bottomPadding={bottomPadding}
        expandType={expandType}
        onCollapse={handleCollapse}
        onExpand={handleExpand}
        onComplete={handleComplete}
      />
    </ExecutionContext.Provider>
  );
}

export function useExecutionContext() {
  return useContext(ExecutionContext);
}
