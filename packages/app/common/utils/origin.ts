import { Nullable, Origin } from '../types';

type OriginData = {
  originURL?: Nullable<string>;
  originName?: Nullable<string>;
  originImageURL?: Nullable<string>;
};

export function parseOrigin<T extends OriginData>(
  origin?: T | null,
): Origin | undefined {
  return origin && origin.originURL
    ? {
        url: origin.originURL,
        title: origin.originName ?? undefined,
        favIconUrl: origin.originImageURL ?? undefined,
      }
    : undefined;
}

export function getOriginIcon(origin: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${origin}`;
}
