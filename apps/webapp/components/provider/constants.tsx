import { NestWalletClient } from '@nestwallet/app/common/api/nestwallet/client';
import { QueryClient } from '@tanstack/react-query';
import { EventEmitter } from 'eventemitter3';

export const eventEmitter = new EventEmitter<string>();
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
export const apiClient = new NestWalletClient(eventEmitter);
