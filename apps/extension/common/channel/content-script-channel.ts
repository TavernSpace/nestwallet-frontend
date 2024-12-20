//
// Communication channels for the injected provider (content-script) and
// the background script.
//

import {
  ETHEREUM_RPC_METHOD_CONNECT,
  ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
  ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
  ETHEREUM_RPC_METHOD_SIGN_TX,
  ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
  IRPCRequest,
  POST_MESSAGE_ORIGIN,
  SOLANA_RPC_METHOD_CONNECT,
  SOLANA_RPC_METHOD_SIGN_MESSAGE,
  SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
} from '@nestwallet/app/common/constants';
import {
  decodeMessage,
  encodeMessage,
} from '@nestwallet/app/common/utils/encode';
import { browser } from 'webextension-polyfill-ts';
import { SidepanelState } from '../constants';
import { BackgroundSessionStorageKey } from '../constants/worker/storage';
import { RpcRequest, RpcResponse, Sender } from '../types';
import { appendWindowId, isValidEventOrigin } from '../utils';
import { RPCRequestMessage, RPCResponseMessage } from './types';

type HandlerFn = (req: RpcRequest, sender: Sender) => Promise<RpcResponse>;

// Channel is a class that establishes communication channel from a
// content/injected script to a background script.
export class ContentScriptChannel {
  // Forwards all messages from the inpage to the background script.
  public static proxy(reqChannel: string) {
    window.addEventListener('message', (event: MessageEvent) => {
      if (!isValidEventOrigin(event)) {
        return;
      }
      const data = decodeMessage<IRPCRequest>(event.data);
      if (!data) return;
      if (data.type !== reqChannel) return;
      browser.runtime.sendMessage({
        channel: reqChannel,
        data: data.detail,
      });
    });
  }

  // Forwards all messages from the background script to the inpage.
  public static proxyReverse(notificationChannel: string, respChannel: string) {
    browser.runtime.onMessage.addListener(
      (message: RPCResponseMessage, sender: Sender) => {
        // message came from this extension's context.
        if (browser && browser.runtime?.id) {
          if (sender.id !== browser.runtime.id) {
            return;
          }
        }
        if (message.channel === notificationChannel) {
          window.postMessage(
            encodeMessage({ type: notificationChannel, detail: message.data }),
            POST_MESSAGE_ORIGIN,
          );
        }
      },
    );
    browser.runtime.onMessage.addListener(
      (message: RPCResponseMessage, sender: Sender) => {
        // message came from this extension's context.
        if (browser && browser.runtime?.id) {
          if (sender.id !== browser.runtime.id) {
            return;
          }
        }
        if (message.channel === respChannel) {
          window.postMessage(
            encodeMessage({ type: respChannel, detail: message.data }),
            POST_MESSAGE_ORIGIN,
          );
        }
      },
    );
  }

  public static client(name: string): ChannelClient {
    return new ChannelClient(name);
  }

  public static server(name: string): ChannelServer {
    return new ChannelServer(name);
  }
}

export class ChannelClient {
  constructor(private name: string) {}

  // Sends a message to the active tab, ignoring any response.
  public async sendMessageActiveTab(data: any) {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab?.id) {
      const tabID = activeTab.id;
      this.sendMessageTab(tabID, data);
    }
  }

  public sendMessageTab(tabId: number, data: any) {
    const event = {
      channel: this.name,
      data,
    };
    browser.tabs.sendMessage(tabId, event);
  }

  public async sendMessageTabs(tabIds: number[], data: any) {
    tabIds.forEach((id) => this.sendMessageTab(id, data));
  }

  public async sendMessageAllTabs(data: any) {
    const tabs = await browser.tabs.query({});
    tabs.forEach(
      (tab) => tab.id && tab.url && this.sendMessageTab(tab.id, data),
    );
  }

  public async sendMessageOrigin(data: any) {
    const tabs = await browser.tabs.query({});
    const originTabs = tabs.filter((tab) => {
      return tab.id && tab.url && new URL(tab.url).origin === data.origin;
    });
    originTabs.forEach((tab) => this.sendMessageTab(tab.id!, data));
  }
}

export class ChannelServer {
  constructor(private name: string) {}

  public handler(handlerFn: HandlerFn) {
    // NOTE: webextension-polyfill is buggy and sender always received undefined
    // As a result we need to use chrome.runtime instead of browser.runtime.
    // Please don't touch this function unless you talked to Peter first
    // https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await
    chrome.runtime.onMessage.addListener(
      (msg: RPCRequestMessage, sender: chrome.runtime.MessageSender) => {
        if (msg.channel !== this.name) {
          return;
        }
        // message must come from the extension -> service worker.
        if (chrome.runtime?.id) {
          if (sender.id !== chrome.runtime.id) {
            return;
          }
        }
        if (!sender.tab?.id) {
          return;
        }
        const isEthereumAction =
          msg.data.method === ETHEREUM_RPC_METHOD_SIGN_MESSAGE ||
          msg.data.method === ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA ||
          msg.data.method === ETHEREUM_RPC_METHOD_SIGN_TX ||
          msg.data.method === ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX ||
          (msg.data.method === ETHEREUM_RPC_METHOD_CONNECT &&
            !!msg.data.params[2]);
        const isSolanaAction =
          msg.data.method === SOLANA_RPC_METHOD_CONNECT ||
          msg.data.method === SOLANA_RPC_METHOD_SIGN_MESSAGE ||
          msg.data.method === SOLANA_RPC_METHOD_SIGN_TRANSACTIONS;
        const isAction = isEthereumAction || isSolanaAction;
        if (isAction) {
          const key = appendWindowId(
            BackgroundSessionStorageKey.SidepanelStatePrefix,
            sender.tab.windowId,
          );
          const windowId = sender.tab.windowId;
          chrome.storage.session.get(key, (state) => {
            if (state[key] === SidepanelState.Active) {
              chrome.sidePanel.open({ windowId }).catch(() => {});
            }
          });
        }
        handlerFn(msg.data, sender as Sender);
      },
    );
  }
}
