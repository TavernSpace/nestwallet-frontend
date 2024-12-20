import { EventEmitter } from 'eventemitter3';
import { createContext, useContext } from 'react';
import { NestWalletClient } from '../common/api/nestwallet/client';

export enum WindowType {
  none = 'none',
  window = 'window',
  popup = 'popup',
  sidepanel = 'sidepanel',
  tab = 'tab',
}

interface INestWalletContext {
  apiClient: NestWalletClient;
  eventEmitter: InstanceType<typeof EventEmitter<string>>;
  windowType?: WindowType;
}

export const NestWalletContext = createContext<INestWalletContext>({} as any);

export function useNestWallet() {
  return useContext(NestWalletContext);
}
