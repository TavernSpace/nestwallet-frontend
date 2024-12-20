import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import { QueryOptions, loadDataFromQuery } from '../../../common/utils/query';
import { ChainId } from '../../chain/chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import {
  calculateAmountToBuy,
  calculateAmountToSell,
  getPumpFunMetadata,
} from './pump-fun';
import { PumpFunInput } from './types';
import { getPumpFunInput } from './utils';

export function usePumpFunRouteQuery(
  input: ISwapAssetInput,
  options?: QueryOptions,
): Loadable<SwapRoute | null> {
  const pumpInput = getPumpFunInput(input);
  const pumpFunRoutesQuery = useQuery({
    queryKey: ['pumpFunRoutesQuery', pumpInput],
    queryFn: async () => getPumpFunRoute(pumpInput!),
    ...options,
    enabled: options?.enabled !== false && !!pumpInput,
  });
  return loadDataFromQuery(pumpFunRoutesQuery);
}

async function getPumpFunRoute(input: PumpFunInput): Promise<SwapRoute | null> {
  const fromAsset = input.fromAsset;
  const fromToken = {
    chainId: ChainId.Solana,
    address: fromAsset?.address || '',
    symbol: fromAsset?.tokenMetadata.symbol || '',
    decimals: fromAsset?.tokenMetadata.decimals || 0,
    name: fromAsset?.tokenMetadata.name || '',
    logoURI: fromAsset?.tokenMetadata.imageUrl || '',
    priceUSD: fromAsset?.tokenMetadata.price || '0',
  };
  const toAsset = input.toAsset;
  const toToken = {
    chainId: ChainId.Solana,
    address: toAsset?.address || '',
    symbol: toAsset?.tokenMetadata.symbol || '',
    decimals: toAsset?.tokenMetadata.decimals || 0,
    name: toAsset?.tokenMetadata.name || '',
    logoURI: toAsset?.tokenMetadata.imageUrl || '',
    priceUSD: toAsset?.tokenMetadata.price || '0',
  };
  const fromMetadata = await getPumpFunMetadata(input.fromAsset?.address!);
  const toMetadata = await getPumpFunMetadata(input.toAsset?.address!);
  const isFromAssetNative = fromAsset?.tokenMetadata.isNativeToken;
  const isToAssetNative = toAsset?.tokenMetadata.isNativeToken;
  const slippage = input.slippage;

  // selling pump to sol
  if (fromMetadata && isToAssetNative) {
    const sendAmountBig = ethers.parseUnits(
      input.amount,
      input.fromAsset!.tokenMetadata.decimals,
    );
    const sendAmount = parseFloat(input.amount);

    const toAmountBig = BigInt(
      Math.round(
        calculateAmountToSell(sendAmount, fromMetadata) *
          10 ** toToken.decimals,
      ),
    );
    const slippageMultiplier = BigInt(
      Math.round((1 / (1 + slippage / 100)) * 10_000),
    );
    const bigMinAmount = (toAmountBig * slippageMultiplier) / 10000n;
    const receiveAmountBig =
      (toAmountBig * 10000n - bigMinAmount * BigInt(input.fee)) / 10000n;
    const receiveAmount = parseFloat(
      ethers.formatUnits(receiveAmountBig, toToken.decimals),
    );
    return {
      data: {
        id: `PumpFun`,
        fromChainId: ChainId.Solana,
        fromAmountUSD: (sendAmount * parseFloat(fromToken.priceUSD)).toString(),
        fromAmount: sendAmountBig.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.Solana,
        toAmountUSD: (receiveAmount * parseFloat(toToken.priceUSD)).toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: receiveAmountBig.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      pumpfun: {
        txType: 'sell',
        inputMint: fromToken.address,
        inAmount: sendAmountBig.toString(),
        outputMint: toToken.address,
        outAmount: receiveAmountBig.toString(),
        slippageBps: slippage * 100,
        metadata: fromMetadata,
      },
    };
  } else if (toMetadata && isFromAssetNative) {
    // buying pump with sol
    const fromBigAmount = ethers.parseUnits(
      input.amount,
      input.fromAsset!.tokenMetadata.decimals,
    );
    const sendAmountBig =
      (fromBigAmount * 10000n - fromBigAmount * BigInt(input.fee)) / 10000n;
    const sendAmount = parseFloat(
      ethers.formatUnits(sendAmountBig, fromToken.decimals),
    );

    const toAmount = Math.round(
      calculateAmountToBuy(sendAmount, toMetadata) * 10 ** toToken.decimals,
    ).toString();
    const toBigAmount = BigInt(toAmount);
    const slippageMultiplier = BigInt(
      Math.round((1 / (1 + slippage / 100)) * 10_000),
    );
    const bigMinAmount = (toBigAmount * slippageMultiplier) / 10000n;
    const toAmountUSD =
      parseFloat(ethers.formatUnits(toBigAmount, toToken.decimals)) *
      parseFloat(toMetadata.price);
    return {
      data: {
        id: `PumpFun`,
        fromChainId: ChainId.Solana,
        fromAmountUSD: (sendAmount * parseFloat(fromToken.priceUSD)).toString(),
        fromAmount: sendAmountBig.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.Solana,
        toAmountUSD: toAmountUSD.toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: toBigAmount.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      pumpfun: {
        txType: 'buy',
        inputMint: fromToken.address,
        inAmount: sendAmountBig.toString(),
        outputMint: toToken.address,
        outAmount: toBigAmount.toString(),
        slippageBps: slippage * 100,
        metadata: toMetadata,
      },
    };
  } else {
    throw new Error('Unable to get pump.fun token data');
  }
}
