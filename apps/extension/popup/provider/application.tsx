import { NestWalletClient } from '@nestwallet/app/common/api/nestwallet/client';
import { VoidPromiseFunction } from '@nestwallet/app/common/types';
import { theme } from '@nestwallet/app/design/paper/theme';
import {
  NestWalletContext,
  WindowType,
} from '@nestwallet/app/provider/nestwallet';
import { SnackbarContextProvider } from '@nestwallet/app/provider/snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient, onlineManager } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { EventEmitter } from 'eventemitter3';
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { WalletServiceClient } from '../../common/wallet/wallet-service-client';
import { clearPersistedRouteState } from '../hooks/app-state';
import { AuthContextProvider } from './auth';
import { ErrorBoundary } from './boundary';
import { LocalLanguageContextProvider } from './local-language';
import { PreferencesContextProvider } from './preferences';

interface IAppContext {
  walletService: WalletServiceClient;
}

const AppContext = createContext<IAppContext>({} as any);

interface IAppContextProviderProps {
  windowType: WindowType;
  onError: VoidPromiseFunction;
  children: ReactNode;
}

const eventEmitter = new EventEmitter<string>();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
const apiClient = new NestWalletClient(eventEmitter);
const walletService = new WalletServiceClient();

export function AppContextProvider(props: IAppContextProviderProps) {
  const { windowType, onError, children } = props;

  const handleInitialError = async () => {
    await clearPersistedRouteState();
  };

  useEffect(() => {
    // fixes react-query doesn't fire requests when connection is slow
    onlineManager.setOnline(true);
  }, []);

  const appContext: IAppContext = useMemo(
    () => ({
      walletService,
    }),
    [],
  );

  return (
    <LocalLanguageContextProvider>
      <PaperProvider theme={theme}>
        <ErrorBoundary onError={onError} onInitialError={handleInitialError}>
          <NestWalletContext.Provider
            value={{
              apiClient,
              eventEmitter,
              windowType,
            }}
          >
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: asyncStoragePersister }}
            >
              <AppContext.Provider value={appContext}>
                <AuthContextProvider>
                  <PreferencesContextProvider>
                    <SnackbarContextProvider>
                      {children}
                    </SnackbarContextProvider>
                  </PreferencesContextProvider>
                </AuthContextProvider>
              </AppContext.Provider>
            </PersistQueryClientProvider>
          </NestWalletContext.Provider>
        </ErrorBoundary>
      </PaperProvider>
    </LocalLanguageContextProvider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
