import { NestWalletContext } from '@nestwallet/app/provider/nestwallet';
import { QueryClientProvider } from '@tanstack/react-query';
import { LoginWithQuery } from '../components/login';
import { AuthContextProvider } from '../components/provider/auth';
import {
  apiClient,
  eventEmitter,
  queryClient,
} from '../components/provider/constants';
import { SnackbarContextProvider } from '../components/provider/snackbar';

export default function LoginPage() {
  return (
    <SnackbarContextProvider>
      <NestWalletContext.Provider value={{ apiClient, eventEmitter }}>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <div className='bg-background h-full w-full overflow-hidden'>
              <LoginWithQuery />;
            </div>
          </AuthContextProvider>
        </QueryClientProvider>
      </NestWalletContext.Provider>
    </SnackbarContextProvider>
  );
}
