import { NestWalletClient } from '@nestwallet/app/common/api/nestwallet/client';
import { QueryClient } from '@tanstack/react-query';
import { EventEmitter } from 'eventemitter3';
import { ConnectionService } from '../common/service/connection-service';
import { EthereumService } from '../common/service/ethereum-service';
import { SessionService } from '../common/service/session-service';
import { SolanaService } from '../common/service/solana-service';
import { AsyncJSONStorage } from '../common/service/storage';
import { TonService } from '../common/service/ton-service';
import { TonConnectProvider } from '../common/service/tonconnect/tonconnect-provider';
import { UserService } from '../common/service/user-service';
import { WalletService } from '../common/service/wallet-service';
import { WalletConnectProvider } from '../common/service/walletconnect-provider';

export const eventEmitter = new EventEmitter<string>();
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});
export const apiClient = new NestWalletClient(eventEmitter);

export const asyncStorage = new AsyncJSONStorage();
export const sessionService = new SessionService(asyncStorage);
export const connectionService = new ConnectionService(sessionService);
export const userService = new UserService(
  asyncStorage,
  eventEmitter,
  connectionService,
  sessionService,
);
export const ethereumService = new EthereumService(
  eventEmitter,
  connectionService,
  userService,
);
export const solanaService = new SolanaService(
  eventEmitter,
  connectionService,
  userService,
);
export const tonService = new TonService(
  eventEmitter,
  connectionService,
  userService,
);
export const walletService = new WalletService(
  apiClient,
  asyncStorage,
  ethereumService,
  solanaService,
  tonService,
  userService,
);
export const walletConnectProvider = new WalletConnectProvider(
  ethereumService,
  solanaService,
  eventEmitter,
  asyncStorage,
);
export const tonConnectProvider = new TonConnectProvider(
  tonService,
  asyncStorage,
);
