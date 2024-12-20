import { ChainId } from '../chain';

// TODO(Andrew/Peter): should use https://github.com/safe-global/safe-deployments/tree/main

type SafeVersion = '1.0.0' | '1.1.1' | '1.2.0' | '1.3.0' | '1.4.1';

export function isSupportedSafeVersion(
  version: string,
): version is SafeVersion {
  return (
    version === '1.0.0' ||
    version === '1.1.1' ||
    version === '1.2.0' ||
    version === '1.3.0' ||
    version === '1.4.1'
  );
}

export const SafeProxyFactoryAddresses = {
  // 1.0.0
  '0x12302fE9c02ff50939BaAaaf415fc226C078613C': new Set([
    ChainId.Ethereum,
    ChainId.Gnosis,
  ]),
  // 1.1.1
  '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B': new Set([
    ChainId.Ethereum,
    ChainId.Gnosis,
  ]),
  // 1.2.0
  // 1.3.0
  '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2': new Set([
    ChainId.Ethereum,
    ChainId.BinanceSmartChain,
    ChainId.Gnosis,
    ChainId.Polygon,
    ChainId.Arbitrum,
    ChainId.Optimism,
    ChainId.Base,
    ChainId.Avalanche,
    ChainId.Scroll,
  ]),
  '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC': new Set([
    ChainId.Ethereum,
    ChainId.BinanceSmartChain,
    ChainId.Gnosis,
    ChainId.Polygon,
    ChainId.Arbitrum,
    ChainId.Optimism,
    ChainId.Base,
    ChainId.Avalanche,
    ChainId.Scroll,
  ]),
  '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2': new Set([ChainId.ZkSync]),
  // 1.4.1
  '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67': new Set([
    ChainId.Ethereum,
    ChainId.BinanceSmartChain,
    ChainId.Gnosis,
    ChainId.Polygon,
    ChainId.Arbitrum,
    ChainId.Optimism,
    ChainId.Base,
    ChainId.Avalanche,
    ChainId.Scroll,
  ]),
};

export function validChainsForSafeProxyFactory(address: string) {
  const chains =
    SafeProxyFactoryAddresses[
      address as unknown as keyof typeof SafeProxyFactoryAddresses
    ];
  return chains || new Set();
}

export function safeProxyAddressToVersion(address: string): SafeVersion {
  const version =
    address === '0x12302fE9c02ff50939BaAaaf415fc226C078613C'
      ? '1.0.0'
      : address === '0x76E2cFc1F5Fa8F6a5b3fC4c8F4788F0116861F9B'
      ? '1.1.1'
      : address === '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2' ||
        address === '0xC22834581EbC8527d974F8a1c97E1bEA4EF910BC' ||
        address === '0xDAec33641865E4651fB43181C6DB6f7232Ee91c2'
      ? '1.3.0'
      : address === '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67'
      ? '1.4.1'
      : null;
  if (!version) {
    throw new Error('Invalid proxy factory address');
  }
  return version;
}

export function isSafeMasterCopyL1(address: string): boolean {
  return (
    // 1.3.0 L2 address
    address !== '0x3E5c63644E683549055b9Be8653de26E0B4CD36E' &&
    address !== '0xfb1bffC9d739B8D520DaF37dF666da4C687191EA' &&
    address !== '0x1727c2c531cf966f902E5927b98490fDFb3b2b70' &&
    // 1.4.1 L2 address
    address !== '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762'
  );
}
