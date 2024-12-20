export function formatSVMAddress(
  account?: string | null,
  isShort?: boolean,
): string | undefined {
  if (!account) {
    return;
  }
  const startLength = isShort ? 4 : 6;
  return `${account.substring(0, startLength)}...${account.substring(
    account.length - 4,
  )}`;
}

export function formatBase58(text: string) {
  if (text.length <= 10) {
    return text;
  }
  return `${text.substring(0, 6)}...${text.substring(text.length - 4)}`;
}
