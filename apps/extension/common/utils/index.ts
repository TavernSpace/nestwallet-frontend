export const environment = 'development';

export function isMobile() {
  // NOTE: set this to true before building mobile inpage
  return false;
}

// Returns true if the event can be used by an injected provider, i.e.,
// it's from a trusted source.
export function isValidEventOrigin(event: MessageEvent): boolean {
  // From same window. Note: window not defined in the service worker context.
  if (typeof window !== 'undefined') {
    if (event.origin === window.location.origin) {
      return true;
    }
  }
  // event.origin is empty for react-native-webview
  return isMobile();
}

export function appendWindowId(value: string, windowId: string | number) {
  return `${value}-${windowId}`;
}

export function splitWindowId(str: string) {
  return parseInt(str.split('-')[1]!);
}
