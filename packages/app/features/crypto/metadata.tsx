import {
  getMint,
  getTokenMetadata,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { tuple } from '../../common/utils/functions';
import { QueryOptions } from '../../common/utils/query';
import { ITokenMetadata } from '../../graphql/client/generated/graphql';
import { ChainId } from '../chain/chain';
import { multicall3 } from '../evm/contract/multicall';
import { getSolanaConnection } from '../svm/utils';
import { getJettonData } from '../tvm/utils';
import { getMetadataAccountDataSerializer } from './serializers';
import { isNativeAddress } from './utils';

const erc20MetadataAbi = [
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        name: '',
        type: 'uint8',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        name: '',
        type: 'string',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
];

function decodeHexToUTF8(hex: string) {
  const pure = hex.slice(2);
  if (pure.length % 64 !== 0) {
    throw new Error('Invalid hex string');
  }
  const byteCount = pure.length / 64;
  const strings: string[] = [];
  for (let index = 0; index < byteCount; index++) {
    if (index >= 2) {
      strings.push(
        ethers.decodeBytes32String(
          `0x${pure.slice(index * 64, (index + 1) * 64)}`,
        ),
      );
    }
  }
  return strings.join();
}

async function getMetaplexMetadata(mintAddress: string) {
  const METADATA_PROGRAM_ID = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  );
  const mintPublicKey = new PublicKey(mintAddress);
  const [metadataPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      METADATA_PROGRAM_ID.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID,
  );
  const connection = getSolanaConnection();
  const metadataAccountInfo = await connection.getAccountInfo(metadataPDA);
  if (!metadataAccountInfo) {
    throw new Error('Metadata account not found');
  }
  const metadataResult = getMetadataAccountDataSerializer().deserialize(
    metadataAccountInfo.data,
  );
  const metadata = metadataResult[0];
  if (!metadata) {
    throw new Error('Token not found');
  }
  return metadata;
}

export async function svmTokenMetadata(
  address: string,
): Promise<ITokenMetadata> {
  const connection = getSolanaConnection();
  const tokenMintAddress = new PublicKey(address);
  try {
    const decimals = await getMint(connection, tokenMintAddress).then(
      (mint) => mint.decimals,
    );
    const metadata = await getMetaplexMetadata(address);
    return {
      id: address,
      address,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals,
      price: '0',
      imageUrl: '',
      isNativeToken: isNativeAddress(address),
    };
  } catch {
    const mintInfo = await getMint(
      connection,
      tokenMintAddress,
      undefined,
      TOKEN_2022_PROGRAM_ID,
    );
    const metadata = await getTokenMetadata(connection, tokenMintAddress);
    if (!metadata) {
      throw new Error('Token not found');
    }
    return {
      id: address,
      address,
      name: metadata.name,
      symbol: metadata.symbol,
      decimals: mintInfo.decimals,
      price: '0',
      imageUrl: '',
      isNativeToken: isNativeAddress(address),
    };
  }
}

export async function evmTokenMetadata(
  address: string,
  chainId: number,
): Promise<ITokenMetadata> {
  const erc20Interface = new ethers.Interface(erc20MetadataAbi);
  const results = await multicall3<string>(chainId, [
    {
      target: address,
      allowFailure: false,
      callData: erc20Interface.encodeFunctionData('name'),
    },
    {
      target: address,
      allowFailure: false,
      callData: erc20Interface.encodeFunctionData('symbol'),
    },
    {
      target: address,
      allowFailure: false,
      callData: erc20Interface.encodeFunctionData('decimals'),
    },
  ]);
  if (results.some((result) => !result[0] || result[1] === '0x')) {
    throw new Error('No token found');
  }
  const [nameRes, symbolRes, decimalsRes] = results;
  const name = decodeHexToUTF8(nameRes![1]);
  const symbol = decodeHexToUTF8(symbolRes![1]);
  const decimals = Number(decimalsRes![1]);

  return {
    id: address,
    address,
    name,
    symbol,
    decimals,
    price: '0',
    imageUrl: '',
    isNativeToken: isNativeAddress(address),
  };
}

export async function tvmTokenMetadata(
  address: string,
): Promise<ITokenMetadata> {
  const token = await getJettonData(address);
  return {
    id: address,
    address: address,
    name: token.name ?? '',
    symbol: token.symbol ?? '',
    decimals: token.decimals && !isNaN(token.decimals) ? token.decimals : 9,
    imageUrl: token.image ?? '',
    price: '0',
    isNativeToken: isNativeAddress(address),
  };
}

export async function tokenMetadata(
  address: string,
  chainId: number,
): Promise<ITokenMetadata> {
  return chainId === ChainId.Solana
    ? await svmTokenMetadata(address)
    : chainId === ChainId.Ton
    ? await tvmTokenMetadata(address)
    : await evmTokenMetadata(address, chainId);
}

export function useEvmTokenMetadataQuery(
  address: string,
  chainId: number,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['evmTokenMetadataQuery', { address, chainId }],
    queryFn: () => evmTokenMetadata(address, chainId),
    ...options,
  });
}

export function useSvmTokenMetadataQuery(
  address: string,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['svmTokenMetadataQuery', { address }],
    queryFn: () => svmTokenMetadata(address),
    ...options,
  });
}

export function useTvmTokenMetadataQuery(
  address: string,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['tvmTokenMetadataQuery', { address }],
    queryFn: () => tvmTokenMetadata(address),
    ...options,
  });
}

export function useMultichainTokenMetadataQuery(
  address: string,
  chains: number[],
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['tokenMetadataQuery', { address, chains }],
    queryFn: async () =>
      isNativeAddress(address)
        ? Promise.resolve([])
        : Promise.all(
            chains.map(async (chain) => {
              const token = await tokenMetadata(address, chain).catch(
                () => null,
              );
              return tuple(chain, token);
            }),
          ),
    ...options,
  });
}
