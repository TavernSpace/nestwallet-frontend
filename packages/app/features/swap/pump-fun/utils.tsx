import { PublicKey } from '@solana/web3.js';
import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { solana } from '../../chain/solana';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';
import { buyPumpFunToken, sellPumpFunToken } from './pump-fun';
import { PumpFunRoute } from './types';

export async function getTransactionFromPumpFunRoute(
  wallet: IWallet,
  route: PumpFunRoute,
  computeUnitPrice?: bigint,
): Promise<SwapTransaction[]> {
  const txType = route.txType;
  const txData =
    txType === 'sell'
      ? await sellPumpFunToken(
          route,
          new PublicKey(wallet.address),
          computeUnitPrice,
        )
      : await buyPumpFunToken(
          route,
          new PublicKey(wallet.address),
          computeUnitPrice,
        );

  return [
    {
      data: {
        to: '',
        data: txData,
        value: '0',
      },
      chainId: solana.id,
      type: 'swap',
    },
  ];
}

export function usePumpFunTransaction(
  props: {
    wallet: IWallet;
    route: PumpFunRoute;
  },
  options?: Omit<UseQueryOptions<SwapTransaction[]>, 'queryKey'>,
) {
  const { wallet, route } = props;
  return useQuery({
    queryKey: ['getPumpFunTransaction', { wallet, route }],
    queryFn: async () => {
      return getTransactionFromPumpFunRoute(wallet, route);
    },
    ...options,
  });
}

export function parsePumpFunTokenUSDPrice(input: string): number {
  const subscriptMap: { [key: string]: number } = {
    '₀': 0,
    '₁': 1,
    '₂': 2,
    '₃': 3,
    '₄': 4,
    '₅': 5,
    '₆': 6,
    '₇': 7,
    '₈': 8,
    '₉': 9,
  };

  let result = '';
  let i = 0;

  while (i < input.length) {
    const currentChar = input[i];
    if (i + 1 < input.length && input[i + 1]! in subscriptMap) {
      let j = i + 1;
      let numberStr = '';

      while (j < input.length && input[j]! in subscriptMap) {
        numberStr += input[j];
        j++;
      }

      const repeatCount = Array.from(numberStr).reduce(
        (acc, char) => acc * 10 + subscriptMap[char]!,
        0,
      );
      result += currentChar!.repeat(repeatCount);
      i = j;
    } else {
      result += currentChar;
      i++;
    }
  }
  const priceInUsd = parseFloat(result);
  return priceInUsd;
}

export function getPumpFunInput(input: ISwapAssetInput) {
  if (!isInputValid(input)) return undefined;
  return {
    amount: ethers.formatUnits(
      ethers.parseUnits(input.amount, input.fromAsset!.tokenMetadata.decimals),
      input.fromAsset!.tokenMetadata.decimals,
    ),
    fromAsset: input.fromAsset!,
    toAsset: input.toAsset!,
    slippage: input.slippage,
    fee: input.fee,
  };
}
