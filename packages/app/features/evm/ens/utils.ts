export function normalizeENS(ens: string) {
  const lastIndex = ens.lastIndexOf('.');
  const prefix = ens.substring(0, lastIndex);
  const domain = ens.substring(lastIndex + 1);
  return [prefix.toLowerCase(), domain.toLowerCase()] as const;
}
