import {
  CHANNEL_ETHEREUM_RPC_RESPONSE,
  CHANNEL_SOLANA_RPC_RESPONSE,
  CHANNEL_TON_RPC_RESPONSE,
} from '@nestwallet/app/common/constants';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { Windows, browser } from 'webextension-polyfill-ts';
import {
  ChannelClient,
  ContentScriptChannel,
} from '../../common/channel/content-script-channel';
import { RequestContext } from '../../common/types';

type WindowType = 'popup' | 'sidepanel';

interface ResolverInfo {
  blockchain: IBlockchainType;
  requestId: string;
  tabId: number | undefined;
  windowType: WindowType;
  resolver: (id: number) => void;
}

export class ApprovalService {
  private resolvers: Record<string, ResolverInfo> = {};
  private clients: Record<IBlockchainType, ChannelClient>;

  constructor() {
    this.clients = {
      [IBlockchainType.Evm]: ContentScriptChannel.client(
        CHANNEL_ETHEREUM_RPC_RESPONSE,
      ),
      [IBlockchainType.Svm]: ContentScriptChannel.client(
        CHANNEL_SOLANA_RPC_RESPONSE,
      ),
      [IBlockchainType.Tvm]: ContentScriptChannel.client(
        CHANNEL_TON_RPC_RESPONSE,
      ),
    };
  }
  // Initiate a request. The given popupFn should relay the given requestmanagerId to
  // the UI, which will send it back with a response.
  //
  // Note that there are two ways we can receive a response.
  //
  // 1) The user can explicit perform a UI action via our components.
  // 2) The user can close the window.
  public requestUiAction(
    blockchain: IBlockchainType,
    requestId: string,
    tabId: number | undefined,
    popupFn: () => Promise<Windows.Window | void | null>,
  ) {
    popupFn().then((window) => {
      this.addResponseResolver(window!, blockchain, requestId, tabId);
    });
  }

  public resolveApproval<TData = unknown, TError = unknown>(
    requestId: string,
    tabId: number | undefined,
    data: TData,
    blockchain: IBlockchainType,
    error?: TError,
  ) {
    if (!tabId) return;
    const resolverInfo = this.resolvers[requestId];
    if (resolverInfo) {
      browser.windows.onRemoved.removeListener(resolverInfo.resolver);
    }
    const client = this.clients[blockchain];
    client.sendMessageTab(tabId, {
      id: requestId,
      result: data,
      error: error,
    });
  }

  public resolveRequest<TData = unknown, TError = unknown>(
    ctx: RequestContext,
    blockchain: IBlockchainType,
    data: TData,
    error?: TError,
  ) {
    const requestId = ctx.request.id;
    const tabId = ctx.sender.tab?.id;
    if (!tabId) return;
    const client = this.clients[blockchain];
    client.sendMessageTab(tabId, {
      id: requestId,
      result: data,
      error: error,
    });
  }

  public rejectAllOfType(type: WindowType) {
    Object.values(this.resolvers).forEach((info) => {
      if (info.windowType === type) {
        this.resolveApproval(
          info.requestId,
          info.tabId,
          undefined,
          info.blockchain,
          'Request rejected',
        );
      }
    });
  }

  private addResponseResolver(
    window: Windows.Window | null,
    blockchain: IBlockchainType,
    requestId: string,
    tabId: number | undefined,
  ) {
    // TODO: this fails when the service worker has died and restarted
    // maybe look into moving this into an event in the popup
    const windowRemovedRoutine = (windowId: number) => {
      if (window && windowId === window.id) {
        this.resolveApproval(
          requestId,
          tabId,
          undefined,
          blockchain,
          'Request rejected',
        );
        browser.windows.onRemoved.removeListener(windowRemovedRoutine);
      }
    };
    this.resolvers[requestId] = {
      requestId,
      tabId,
      blockchain,
      windowType: window ? 'popup' : 'sidepanel',
      resolver: windowRemovedRoutine,
    };
    browser.windows.onRemoved.addListener(windowRemovedRoutine);
  }
}
