import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { Loadable } from '../../../common/types';
import { QueryOptions, loadDataFromQuery } from '../../../common/utils/query';
import { ChainId } from '../../chain/chain';
import { ISwapAssetInput, SwapRoute } from '../types';
import { calculateAmountToBuy, calculateAmountToSell } from './moonshot';
import { MoonshotInput } from './types';
import { getMoonshotInput, getMoonshotTokenInfo } from './utils';

export function useMoonshotRouteQuery(
  input: ISwapAssetInput,
  options?: QueryOptions,
): Loadable<SwapRoute | null> {
  const moonshotInput = getMoonshotInput(input);
  const moonshotRoutesQuery = useQuery({
    queryKey: ['moonshotRoutesQuery', moonshotInput],
    queryFn: async () => getMoonshotRoute(moonshotInput!),
    ...options,
    enabled: options?.enabled !== false && !!moonshotInput,
  });
  return loadDataFromQuery(moonshotRoutesQuery);
}

async function getMoonshotRoute(
  input: MoonshotInput,
): Promise<SwapRoute | null> {
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

  const isFromAssetNative = fromAsset?.tokenMetadata.isNativeToken;
  const isToAssetNative = toAsset?.tokenMetadata.isNativeToken;
  const fromTokenMetadata = isToAssetNative
    ? await getMoonshotTokenInfo(fromAsset?.address)
    : null;
  const toTokenMetadata = isFromAssetNative
    ? await getMoonshotTokenInfo(toAsset?.address)
    : null;
  const slippage = input.slippage;

  // selling moonshot to sol
  if (fromTokenMetadata && isToAssetNative) {
    const sendAmountBig = ethers.parseUnits(
      input.amount,
      input.fromAsset!.tokenMetadata.decimals,
    );
    const sendAmount = parseFloat(input.amount);
    const toAmountBig = BigInt(
      Math.round(
        calculateAmountToSell(fromTokenMetadata, sendAmount) *
          10 ** toToken.decimals,
      ),
    );

    const slippageMultiplier = BigInt(
      Math.round((1 / (1 + slippage / 100)) * 10_000),
    );
    const bigMinAmount = (toAmountBig * slippageMultiplier) / 10000n;
    const recieveAmountBig =
      (toAmountBig * 10000n - bigMinAmount * BigInt(input.fee)) / 10000n;
    const receiveAmount = parseFloat(
      ethers.formatUnits(recieveAmountBig, toToken.decimals),
    );
    return {
      data: {
        id: `Moonshot`,
        fromChainId: ChainId.Solana,
        fromAmountUSD: (sendAmount * parseFloat(fromToken.priceUSD)).toString(),
        fromAmount: sendAmountBig.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.Solana,
        toAmountUSD: (receiveAmount * parseFloat(toToken.priceUSD)).toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: recieveAmountBig.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      moonshot: {
        txType: 'sell',
        inputMint: fromToken.address,
        inAmount: sendAmountBig,
        outputMint: toToken.address,
        outAmount: recieveAmountBig,
        slippageBps: slippage * 100,
        tokenMetadata: fromTokenMetadata,
      },
    };
  } else if (toTokenMetadata && isFromAssetNative) {
    // buying moonshot with sol
    const fromBigAmount = ethers.parseUnits(input.amount, fromToken.decimals);
    const sendAmountBig =
      (fromBigAmount * 10000n - fromBigAmount * BigInt(input.fee)) / 10000n;
    const sendAmount = parseFloat(
      ethers.formatUnits(sendAmountBig, fromToken.decimals),
    );

    const toAmountBig = BigInt(
      Math.round(
        calculateAmountToBuy(toTokenMetadata, sendAmount) *
          10 ** toToken.decimals,
      ),
    );
    const slippageMultiplier = BigInt(
      Math.round((1 / (1 + slippage / 100)) * 10_000),
    );
    const bigMinAmount = (toAmountBig * slippageMultiplier) / 10000n;
    const toAmountUSD =
      parseFloat(ethers.formatUnits(toAmountBig, toToken.decimals)) *
      parseFloat(toTokenMetadata.priceUsd);
    return {
      data: {
        id: `Moonshot`,
        fromChainId: ChainId.Solana,
        fromAmountUSD: (sendAmount * parseFloat(fromToken.priceUSD)).toString(),
        fromAmount: sendAmountBig.toString(),
        fromToken: fromToken,
        fromAddress: fromToken.address,
        toChainId: ChainId.Solana,
        toAmountUSD: toAmountUSD.toString(),
        toAmountMin: bigMinAmount.toString(),
        toAmount: toAmountBig.toString(),
        toToken: toToken,
        toAddress: toToken.address,
      },
      moonshot: {
        txType: 'buy',
        inputMint: fromToken.address,
        inAmount: sendAmountBig,
        outputMint: toToken.address,
        outAmount: toAmountBig,
        slippageBps: slippage * 100,
        tokenMetadata: toTokenMetadata,
      },
    };
  } else {
    throw new Error('Unable to get moonshot token data');
  }
}
