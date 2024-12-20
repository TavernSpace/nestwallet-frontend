import { v4 } from 'uuid';
import { browser } from 'webextension-polyfill-ts';
import { RpcRequest, RpcResponse, Sender } from '../types';
import { RPCRequestMessage } from './types';

type HandlerFn = (req: RpcRequest, sender: Sender) => Promise<RpcResponse>;
type ResponseType = (response: any) => void;

export class PopupServiceChannel {
  public static client(name: string): PopupChannelClient {
    return new PopupChannelClient(name);
  }

  public static server(name: string): PopupChannelServer {
    return new PopupChannelServer(name);
  }
}

export class PopupChannelClient {
  constructor(private name: string) {}

  public async request(req: Omit<RpcRequest, 'id'>): Promise<RpcResponse> {
    const id = v4();
    const { method, params } = req;
    const response = await browser.runtime.sendMessage({
      channel: this.name,
      data: { id, method, params },
    } as RPCRequestMessage);
    if (response) {
      const { result, error } = response;
      if (error) {
        throw new Error(error);
      }
      return result;
    }
  }
}

export class PopupChannelServer {
  constructor(private name: string) {}

  public handler(handlerFn: HandlerFn) {
    // NOTE: webextension-polyfill is buggy and sender always received undefined
    // As a result we need to use chrome.runtime instead of browser.runtime.
    // Please don't touch this function unless you talked to Peter first
    // https://stackoverflow.com/questions/44056271/chrome-runtime-onmessage-response-with-async-await
    chrome.runtime.onMessage.addListener(
      (
        msg: RPCRequestMessage,
        sender: chrome.runtime.MessageSender,
        sendResponse: ResponseType,
      ) => {
        if (msg.channel !== this.name) {
          return;
        }
        // message must come from the extension UI -> service worker.
        if (chrome.runtime?.id) {
          if (sender.id !== chrome.runtime.id) {
            return;
          }
        }
        const id = msg.data.id;
        handlerFn(msg.data, sender as any)
          .then((resp) => {
            const [result, error] = resp;
            sendResponse({ id, result, error });
          })
          .catch((err: any) => {
            sendResponse({ id, error: err.toString() });
          });
        return true;
      },
    );
  }
}
