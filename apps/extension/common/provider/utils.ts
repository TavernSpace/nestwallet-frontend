export function getSiteMetadata() {
  try {
    const openGraphTitle =
      document
        .querySelector('meta[property="og:title"]')
        ?.getAttribute('content') ?? undefined;
    const appleTouchIcon =
      document
        .querySelector('link[rel="apple-touch-icon"]')
        ?.getAttribute('href') ?? undefined;
    return { title: openGraphTitle, imageUrl: appleTouchIcon };
  } catch {
    return { title: undefined, imageUrl: undefined };
  }
}

export function getOriginIcon(origin: string) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${origin}`;
}
