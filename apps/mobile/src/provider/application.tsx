import { useExperimentalAnimation } from '@nestwallet/app/common/hooks/animation';
import { theme } from '@nestwallet/app/design/paper/theme';
import { ForceUpdateContextProvider } from '@nestwallet/app/provider/force-update';
import { NestWalletContext } from '@nestwallet/app/provider/nestwallet';
import { SnackbarContextProvider } from '@nestwallet/app/provider/snackbar';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { ReactNode, createContext, useContext, useMemo } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { ConnectionService } from '../common/service/connection-service';
import { EthereumService } from '../common/service/ethereum-service';
import { SolanaService } from '../common/service/solana-service';
import { TonService } from '../common/service/ton-service';
import { TonConnectProvider } from '../common/service/tonconnect/tonconnect-provider';
import { UserService } from '../common/service/user-service';
import { WalletService } from '../common/service/wallet-service';
import { WalletConnectProvider } from '../common/service/walletconnect-provider';
import { useInitializeNotifications } from '../hooks/notification';
import { AuthContextProvider } from './auth';
import { ErrorBoundary } from './boundary';
import {
  apiClient,
  connectionService,
  ethereumService,
  eventEmitter,
  queryClient,
  solanaService,
  tonConnectProvider,
  tonService,
  userService,
  walletConnectProvider,
  walletService,
} from './constants';
import { LocalLanguageContextProvider } from './local-language';
import { PreferencesContextProvider } from './preferences';

interface IAppContext {
  connectionService: ConnectionService;
  ethereumService: EthereumService;
  solanaService: SolanaService;
  tonService: TonService;
  userService: UserService;
  walletService: WalletService;
  walletConnectProvider: WalletConnectProvider;
  tonConnectProvider: TonConnectProvider;
}

export const AppContext = createContext<IAppContext>({} as any);

interface IAppContextProviderProps {
  children: ReactNode;
}

export function AppContextProvider(props: IAppContextProviderProps) {
  const { children } = props;

  useExperimentalAnimation();
  useInitializeNotifications();

  // TODO: what to do if this fails?
  const [fontsLoaded] = useFonts({
    Aeonik_300Light: require('../../assets/fonts/Aeonik_Light.otf'),
    Aeonik_300LightItalic: require('../../assets/fonts/Aeonik_LightItalic.otf'),
    Aeonik_400Regular: require('../../assets/fonts/Aeonik_Regular.otf'),
    Aeonik_400RegularItalic: require('../../assets/fonts/Aeonik_RegularItalic.otf'),
    Aeonik_500Medium: require('../../assets/fonts/Aeonik_Medium.otf'),
    Aeonik_500MediumItalic: require('../../assets/fonts/Aeonik_MediumItalic.otf'),
    Aeonik_700Bold: require('../../assets/fonts/Aeonik_Bold.otf'),
    Aeonik_700BoldItalic: require('../../assets/fonts/Aeonik_BoldItalic.otf'),
  });

  const appContext: IAppContext = useMemo(
    () => ({
      connectionService,
      ethereumService,
      solanaService,
      tonService,
      walletService,
      userService,
      walletConnectProvider,
      tonConnectProvider,
    }),
    [],
  );

  const nestWalletContext = useMemo(() => ({ apiClient, eventEmitter }), []);

  return (
    <LocalLanguageContextProvider>
      <ErrorBoundary>
        <PaperProvider theme={theme}>
          <QueryClientProvider client={queryClient}>
            <NestWalletContext.Provider value={nestWalletContext}>
              <ForceUpdateContextProvider>
                <AppContext.Provider value={appContext}>
                  <AuthContextProvider>
                    <PreferencesContextProvider>
                      <SnackbarContextProvider>
                        {children}
                      </SnackbarContextProvider>
                    </PreferencesContextProvider>
                  </AuthContextProvider>
                </AppContext.Provider>
              </ForceUpdateContextProvider>
            </NestWalletContext.Provider>
          </QueryClientProvider>
        </PaperProvider>
      </ErrorBoundary>
    </LocalLanguageContextProvider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
