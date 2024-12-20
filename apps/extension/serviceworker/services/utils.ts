import { Origin } from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import {
  RequestContext,
  RpcRequest,
  RpcResponse,
  Sender,
} from '../../common/types';

// Utility to transform the handler API into something a little more friendly.
export function getRequestContext(
  data: RpcRequest,
  sender: Sender,
): RequestContext {
  const origin = sender.origin;
  if (!origin) {
    throw new Error('origin is undefined');
  }
  return {
    request: data,
    sender,
  };
}

export function withRequestContext(
  handler: (ctx: RequestContext) => Promise<RpcResponse>,
) {
  return async (data: RpcRequest, sender: Sender) => {
    try {
      const ctx = getRequestContext(data, sender);
      const resp = await handler(ctx);
      return [resp, undefined];
    } catch (err) {
      return [undefined, (err as Error).toString()];
    }
  };
}

export function getOrigin(
  ctx: RequestContext,
  openGraphTitle?: string,
  appleTouchIcon?: string,
): Origin {
  const tab = ctx.sender.tab;
  const url = tab?.url ? new URL(tab.url) : undefined;
  if (!url) {
    return {
      title: undefined,
      url: undefined,
      favIconUrl: undefined,
    };
  }
  const origin = url.origin;
  const defaultIcon = getOriginIcon(origin);
  const icon = !appleTouchIcon
    ? defaultIcon
    : appleTouchIcon.startsWith('https://')
    ? appleTouchIcon
    : appleTouchIcon.startsWith('/')
    ? origin + appleTouchIcon
    : origin + '/' + appleTouchIcon;
  return {
    title: openGraphTitle ?? tab?.title,
    favIconUrl: icon,
    url: origin,
  };
}
