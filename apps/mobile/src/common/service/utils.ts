import { Origin } from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import { RequestContext } from './types';

export function getOrigin(
  ctx: RequestContext,
  openGraphTitle?: string,
  appleTouchIcon?: string,
): Origin {
  const sender = ctx.sender;
  const url = new URL(sender.url);
  const origin = url.origin;
  const defaultIcon = ctx.sender.imageUrl || getOriginIcon(origin);
  const icon = !appleTouchIcon
    ? defaultIcon
    : appleTouchIcon.startsWith('https://')
    ? appleTouchIcon
    : appleTouchIcon.startsWith('/')
    ? origin + appleTouchIcon
    : origin + '/' + appleTouchIcon;
  return {
    title: openGraphTitle || sender?.title || url.hostname,
    favIconUrl: icon,
    url: origin,
  };
}
