export function encodePayload(payload: {}) {
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodePayload<T>(payload: string): T {
  return JSON.parse(decodeURIComponent(payload));
}
