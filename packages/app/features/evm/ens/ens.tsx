import { useQuery } from '@tanstack/react-query';
import { fetchCustomGraphql } from '../../../common/hooks/graphql';
import { QueryOptions } from '../../../common/utils/query';
import { ChainId } from '../../chain';
import { getJSONRPCProvider } from '../provider';
import { normalizeENS } from './utils';

export function useResolveENS(ens: string, options?: QueryOptions) {
  return useQuery({
    queryKey: ['resolveENSQuery', { ens }],
    queryFn: () => resolveName(ens),
    ...options,
    enabled: isValidName(ens) && options?.enabled !== false,
  });
}

async function resolveName(name: string): Promise<string | null> {
  const [prefix, domain] = normalizeENS(name);
  const normalized = `${prefix}.${domain}`;
  if (domain === 'eth') {
    const provider = getJSONRPCProvider(ChainId.Ethereum, {
      ensAddress: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    });
    return provider.resolveName(normalized);
  } else if (domain === 'blast') {
    const query = `
      query BlastDomainOwner($name: String!) {
        domains(where: { name: $name}) {
          owner
        }
      }
    `;
    const result: any = await fetchCustomGraphql(
      'https://blastsubgraph.ryoshi.id/subgraphs/name/blastENS',
      query,
      { name: prefix },
    );
    if (result?.data?.domains) {
      return result.data.domains[0]?.owner ?? null;
    } else {
      return null;
    }
  } else if (domain === 'arb') {
    const provider = getJSONRPCProvider(ChainId.Arbitrum, {
      ensAddress: '0x4a067EE58e73ac5E4a43722E008DFdf65B2bF348',
    });
    return provider.resolveName(normalized);
  } else if (domain === 'base') {
    const provider = getJSONRPCProvider(ChainId.Base, {
      ensAddress: '0xeCBaE6E54bAA669005b93342E5650d5886D54fc7',
    });
    return provider.resolveName(normalized);
  } else if (domain === 'bnb') {
    const provider = getJSONRPCProvider(ChainId.BinanceSmartChain, {
      ensAddress: '0x08CEd32a7f3eeC915Ba84415e9C07a7286977956',
    });
    return provider.resolveName(normalized);
  }
  return null;
}

function isValidName(name: string) {
  const validDomains = ['eth', 'blast', 'arb', 'base', 'bnb'];
  const lastIndex = name.lastIndexOf('.');
  if (lastIndex === -1) {
    return false;
  }
  const parts = [name.substring(0, lastIndex), name.substring(lastIndex + 1)];
  return parts[0] !== '' && validDomains.includes(parts[1]!.toLowerCase());
}
