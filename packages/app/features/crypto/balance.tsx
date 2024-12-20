import { getHttpEndpoints } from '@orbs-network/ton-access';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { Address, TonClient } from '@ton/ton';
import { ethers } from 'ethers';
import { isNil, unzip, zip } from 'lodash';
import { formatCrypto } from '../../common/format/number';
import { Tuple } from '../../common/types';
import {
  collect,
  recordFrom,
  recordify,
  tuple,
} from '../../common/utils/functions';
import { QueryOptions } from '../../common/utils/query';
import {
  IBlockchainType,
  ICryptoBalance,
  IPositionType,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ChainId, getChainInfo } from '../chain';
import { nullAddress } from '../evm/constants';
import { erc20DecimalsABIInterface } from '../evm/contract/abi';
import {
  encodeGetEthBalance,
  multicall3,
  multicall3Address,
} from '../evm/contract/multicall';
import { getJSONRPCProvider } from '../evm/provider';
import { nativeSolAddress } from '../svm/constants';
import { getSolanaConnection } from '../svm/utils';
import { nativeTonAddress } from '../tvm/constants';
import { svmTokenMetadata, tvmTokenMetadata } from './metadata';
import { cryptoKey, isNativeAddress } from './utils';

export interface IBalanceOf {
  tokenAddress: string;
  chainId: number;
  balance: string;
}

const balanceOfAbi = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];

export async function fetchDecimals(chainId: number, address: string) {
  if (chainId === ChainId.Solana) {
    if (address === nativeSolAddress) {
      return 9;
    }
    const metadata = await svmTokenMetadata(address);
    return metadata.decimals;
  } else if (chainId === ChainId.Ton) {
    if (address === nativeTonAddress) {
      return 9;
    }
    const metadata = await tvmTokenMetadata(address);
    return metadata.decimals;
  } else if (address === nullAddress) {
    return 18;
  } else {
    const provider = getJSONRPCProvider(chainId);
    const contract = new ethers.Contract(
      address,
      erc20DecimalsABIInterface,
      provider,
    );
    const decimals: bigint = await contract.decimals!();
    return Number(decimals);
  }
}

export async function getLatestBalances(
  walletAddress: string,
  blockchain: IBlockchainType,
  tokenAddresses: [string, number][],
) {
  if (tokenAddresses.length === 0 || blockchain !== IBlockchainType.Evm) {
    return {};
  }
  const balanceOfInterface = new ethers.Interface(balanceOfAbi);
  const chainBalances = collect(tokenAddresses, ([_, chainId]) =>
    chainId.toString(),
  );
  const results = await Promise.all(
    Object.keys(chainBalances).map((key) =>
      multicall3<string>(
        parseInt(key),
        chainBalances[key]!.map(([address, chainId]) => ({
          target: isNativeAddress(address)
            ? multicall3Address(chainId)
            : address,
          allowFailure: false,
          callData: isNativeAddress(address)
            ? encodeGetEthBalance(walletAddress)
            : balanceOfInterface.encodeFunctionData('balanceOf', [
                walletAddress,
              ]),
        })),
      ).then((result) =>
        zip(chainBalances[key]!, result).map(([balance, multicall]) =>
          tuple(balance!, multicall!),
        ),
      ),
    ),
  );
  return recordFrom(
    results.flat(),
    ([[address, chainId]]) => cryptoKey({ address, chainId }),
    (item) => item[1][1],
  );
}

export function latestBalanceQueryKey(
  address: string,
  blockchain: IBlockchainType,
  tokenAddresses?: Record<string, [string, number]>,
) {
  return tuple(
    'latestBalanceForTokensQuery',
    address,
    blockchain,
    tokenAddresses,
  );
}

export function useLatestBalancesQuery(
  wallet: IWallet,
  addresses: [string, number][],
  options?: QueryOptions,
) {
  const key = latestBalanceQueryKey(
    wallet.address,
    wallet.blockchain,
    recordify(addresses, ([address, chainId]) =>
      cryptoKey({ address, chainId }),
    ),
  );
  return useQuery({
    queryKey: key,
    queryFn: () =>
      getLatestBalances(wallet.address, wallet.blockchain, addresses),
    placeholderData: (prevData, prevQuery) =>
      prevQuery?.queryKey[1] === key[1] ? prevData : undefined,
    ...options,
  });
}

export async function augmentWithNativeBalances<
  TData extends { address: string },
>(chainId: ChainId, data: TData[]) {
  if (chainId === ChainId.Solana) {
    return augmentWithSvmNativeBalances(chainId, data);
  } else if (chainId === ChainId.Ton) {
    return augmentWithTvmNativeBalances(chainId, data);
  } else {
    return augmentWithEvmNativeBalances(chainId, data);
  }
}

export async function augmentWithEvmNativeBalances<
  TData extends { address: string },
>(chainId: ChainId, data: TData[]) {
  const ethBalances = await Promise.all(
    [
      ChainId.Ethereum,
      ChainId.Arbitrum,
      ChainId.Optimism,
      ChainId.Base,
      ChainId.Blast,
      ChainId.Linea,
      ChainId.Scroll,
      ChainId.ZkSync,
      ChainId.Zora,
    ].map((chainId) =>
      multicall3<string>(
        chainId,
        data.map(({ address }) => ({
          target: multicall3Address(chainId),
          allowFailure: false,
          callData: encodeGetEthBalance(address),
        })),
      )
        .then((result) => result.map((value) => BigInt(value[1])))
        .catch(() => data.map(() => 0n)),
    ),
  );
  return unzip(ethBalances)
    .map((balance) => ({
      balance: formatCrypto(
        balance.reduce((acc, cur) => acc + cur, 0n),
        18,
      ),
    }))
    .map((balance, index) => ({
      ...balance,
      data: data[index]!,
    }));
}

export async function augmentWithSvmNativeBalances<
  TData extends { address: string },
>(chainId: ChainId, data: TData[]) {
  const chainInfo = getChainInfo(chainId);
  const connection = getSolanaConnection();
  const promises = data.map(async (item) => {
    const balanceLamport = await connection
      .getBalance(new PublicKey(item.address))
      .catch(() => 0);
    const balance = formatCrypto(
      balanceLamport.toString(),
      chainInfo.nativeCurrency.decimals,
    );
    return {
      data: item,
      balance: balance,
    };
  });
  return Promise.all(promises);
}

export async function augmentWithTvmNativeBalances<
  TData extends { address: string },
>(chainId: ChainId, data: TData[]) {
  const chainInfo = getChainInfo(chainId);
  const endpoints = await getHttpEndpoints();
  const tonClients = endpoints.map(
    (endpoint) =>
      new TonClient({
        endpoint,
      }),
  );
  const promises = data.map(async (item, index) => {
    const client = tonClients[index % tonClients.length]!;
    const result = await client
      .getBalance(Address.parseFriendly(item.address).address)
      .catch(() => 0n);
    const balance = formatCrypto(
      result.toString(),
      chainInfo.nativeCurrency.decimals,
    );
    return {
      data: item,
      balance,
    };
  });
  return Promise.all(promises);
}

export function computePNL(balance: ICryptoBalance): [number, number, number] {
  const balanceInUSD = parseFloat(balance.balanceInUSD);
  const averagePriceUSD = balance.averagePriceUSD;
  if (!balanceInUSD || isNil(averagePriceUSD)) {
    return [0, 0, 0];
  }
  const balanceFloat = parseFloat(
    ethers.formatUnits(balance.balance, balance.tokenMetadata.decimals),
  );
  const totalCostBasis = balanceFloat * averagePriceUSD;
  const change = balanceInUSD - totalCostBasis;
  const percent =
    totalCostBasis > 0 ? Math.abs(change / totalCostBasis) * 100 : 0;
  return [totalCostBasis === 0 ? 0 : change, percent, totalCostBasis];
}

export function isSimpleBalance(balance: ICryptoBalance) {
  return !balance.positionInfo;
}

export function isDebt(balance: ICryptoBalance) {
  return balance.positionInfo?.type === IPositionType.Loan;
}

// Lifi has a bug where selling all leaves you with 1 balance, filter these out
export function isDust(balance: ICryptoBalance) {
  return balance.balance === '1' && balance.tokenMetadata.decimals >= 6;
}

export function computeAggregatePNL(balances: ICryptoBalance[]) {
  return balances.reduce(
    (acc, cur): Tuple<number, 3> => {
      const [change, _, totalCostBasis] = computePNL(cur);
      const newChange = acc[0] + change;
      const newBasis =
        acc[2] + (totalCostBasis || parseFloat(cur.balanceInUSD));
      return [
        newChange,
        newBasis > 0 ? Math.abs(newChange / newBasis) : 0,
        newBasis,
      ];
    },
    [0, 0, 0] as Tuple<number, 3>,
  );
}
