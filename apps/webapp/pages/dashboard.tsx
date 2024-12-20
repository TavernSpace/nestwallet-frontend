import { NestWalletContext } from '@nestwallet/app/provider/nestwallet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { DashboardWithQuery } from '../components/dashboard';
import { AuthContextProvider } from '../components/provider/auth';
import {
  apiClient,
  eventEmitter,
  queryClient,
} from '../components/provider/constants';
import { SnackbarContextProvider } from '../components/provider/snackbar';

export default function DashboardPage() {
  const router = useRouter();
  const { referral } = router.query;
  return (
    <SnackbarContextProvider>
      <NestWalletContext.Provider value={{ apiClient, eventEmitter }}>
        <QueryClientProvider client={queryClient}>
          <AuthContextProvider>
            <div className='bg-background h-full w-full overflow-hidden'>
              <DashboardWithQuery referralCode={`${referral}`} />;
            </div>
          </AuthContextProvider>
        </QueryClientProvider>
      </NestWalletContext.Provider>
    </SnackbarContextProvider>
  );
}
