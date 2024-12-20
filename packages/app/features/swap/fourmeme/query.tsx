import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import { loadDataFromQuery, QueryOptions } from '../../../common/utils/query';
import { ChainId } from '../../chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { FourMemeInput } from './types';
import { getFourMemeInput, getFourMemeTokenMetadata } from './utils';

export function useFourMemeRouteQuery(
  input: ISwapAssetInput,
  options?: QueryOptions,
): Loadable<SwapRoute | null> {
  const fourMemeInput = getFourMemeInput(input);
  const fourMemeRoutesQuery = useQuery({
    queryKey: ['fourMemeRoutesQuery', fourMemeInput],
    queryFn: async () => getFourMemeRoute(fourMemeInput!),
    ...options,
    enabled: options?.enabled !== false && !!fourMemeInput,
  });
  return loadDataFromQuery(fourMemeRoutesQuery);
}

async function getFourMemeRoute(
  input: FourMemeInput,
): Promise<SwapRoute | null> {
  const fromAsset = input.fromAsset;
  const fromToken = {
    chainId: ChainId.BinanceSmartChain,
    address: fromAsset?.address || '',
    symbol: fromAsset?.tokenMetadata.symbol || '',
    decimals: fromAsset?.tokenMetadata.decimals || 0,
    name: fromAsset?.tokenMetadata.name || '',
    logoURI: fromAsset?.tokenMetadata.imageUrl || '',
    priceUSD: fromAsset?.tokenMetadata.price || '0',
  };
  const toAsset = input.toAsset;
  const toToken = {
    chainId: ChainId.BinanceSmartChain,
    address: toAsset?.address || '',
    symbol: toAsset?.tokenMetadata.symbol || '',
    decimals: toAsset?.tokenMetadata.decimals || 0,
    name: toAsset?.tokenMetadata.name || '',
    logoURI: toAsset?.tokenMetadata.imageUrl || '',
    priceUSD: toAsset?.tokenMetadata.price || '0',
  };
  const fromMetadata = await getFourMemeTokenMetadata(
    input.fromAsset?.address!,
  );
  const toMetadata = await getFourMemeTokenMetadata(input.toAsset?.address!);
  const isFromAssetNative = fromAsset?.tokenMetadata.isNativeToken;
  const isToAssetNative = toAsset?.tokenMetadata.isNativeToken;
  const slippage = input.slippage;

  // selling four.meme to bnb
  if (fromMetadata && isToAssetNative) {
    const fromAmount = parseFloat(input.amount);
    const fromBigAmount = ethers.parseUnits(
      input.amount,
      input.fromAsset!.tokenMetadata.decimals,
    );
    const tokenToBNBRatio =
      parseFloat(fromMetadata.tokenPrice.bamount) /
      parseFloat(fromMetadata.tokenPrice.tamount);

    const totalToAmount = fromAmount * tokenToBNBRatio;
    const totalToBigAmount = ethers.parseUnits(
      totalToAmount.toFixed(toToken.decimals),
      toToken.decimals,
    );
    const actualToBigAmount = calculateActualBNBAmount(totalToBigAmount);
    if (!actualToBigAmount) {
      return null;
    }
    const actualToAmount = parseFloat(
      ethers.formatUnits(actualToBigAmount, toToken.decimals),
    );

    return {
      data: {
        id: `four.meme`,
        fromChainId: ChainId.BinanceSmartChain,
        // the memecoin price is calculated from the total amount of BNB returned for the swap
        fromAmountUSD: (
          totalToAmount * parseFloat(toToken.priceUSD)
        ).toString(),
        fromAmount: fromBigAmount.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.BinanceSmartChain,
        toAmountUSD: (actualToAmount * parseFloat(toToken.priceUSD)).toString(),
        toAmountMin: '0', // NO SLIPPAGE OPTION FOR FOUR.MEME SELL
        toAmount: actualToBigAmount.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      fourMeme: {
        txType: 'sell',
        inputMint: fromToken.address,
        inAmount: fromBigAmount.toString(),
        outputMint: toToken.address,
        outAmount: actualToBigAmount.toString(),
        slippageBps: 10_000, // NO SLIPPAGE OPTION FOR FOUR.MEME SELL
        metadata: fromMetadata,
      },
    };
  }

  // buying four.meme with bnb
  if (toMetadata && isFromAssetNative) {
    const totalFromAmount = parseFloat(input.amount);
    const totalFromBigAmount = ethers.parseUnits(
      input.amount,
      input.fromAsset!.tokenMetadata.decimals,
    );
    const actualFromBigAmount = calculateActualBNBAmount(totalFromBigAmount);
    if (!actualFromBigAmount) {
      return null;
    }
    if (
      toMetadata.maxBuy &&
      toMetadata.maxBuy !== '' &&
      actualFromBigAmount >=
        ethers.parseUnits(toMetadata.maxBuy, fromToken.decimals)
    ) {
      return null;
    }
    const actualFromAmount = parseFloat(
      ethers.formatUnits(actualFromBigAmount, fromToken.decimals),
    );

    const bnbToTokenRatio =
      parseFloat(toMetadata.tokenPrice.tamount) /
      parseFloat(toMetadata.tokenPrice.bamount);

    const toAmount = actualFromAmount * bnbToTokenRatio;
    const toBigAmount = ethers.parseUnits(
      toAmount.toFixed(toToken.decimals),
      toToken.decimals,
    );

    const slippageMultiplier = BigInt(
      Math.round((1 / (1 + slippage / 100)) * 10_000),
    );
    const bigMinAmount = (toBigAmount * slippageMultiplier) / 10000n;
    return {
      data: {
        id: `four.meme`,
        fromChainId: ChainId.BinanceSmartChain,
        fromAmountUSD: (
          totalFromAmount * parseFloat(fromToken.priceUSD)
        ).toString(),
        fromAmount: totalFromBigAmount.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.BinanceSmartChain,
        // the memecoin price is calculated from the actual amount of BNB used for the swap
        toAmountUSD: (
          actualFromAmount * parseFloat(fromToken.priceUSD)
        ).toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: toBigAmount.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      fourMeme: {
        txType: 'buy',
        inputMint: fromToken.address,
        inAmount: actualFromBigAmount.toString(),
        buyAmountWithPlatformFee: totalFromBigAmount.toString(),
        outputMint: toToken.address,
        outAmount: toBigAmount.toString(),
        slippageBps: slippage * 100,
        metadata: toMetadata,
      },
    };
  }
  return null;
}

function calculateActualBNBAmount(totalInput: bigint): bigint | undefined {
  if (totalInput <= ethers.parseUnits('0.001', 18)) {
    // total Input BNB is not enough to cover four.meme fee
    return undefined;
  } else if (totalInput <= ethers.parseUnits('0.201', 18)) {
    return totalInput - ethers.parseUnits('0.001');
  } else {
    return (totalInput * 200n) / 201n;
  }
}
