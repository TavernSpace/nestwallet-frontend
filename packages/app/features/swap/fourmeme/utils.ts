import { ethers } from 'ethers';
import { handleJSONResponse } from '../../../common/api/utils';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { tokenApproval } from '../../crypto/approval';
import { getERC20ApprovalTransactionData } from '../../evm/contract/encode';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';
import { fourMemeContractAddress } from './abi';
import {
  getPurchaseTokenTransactionData,
  getSaleTokenTransactionData,
} from './fourmeme';
import {
  FourMemeInput,
  FourMemeRoute,
  FourMemeTokenDetailsResponse,
  FourMemeTokenMetadata,
} from './types';

export async function getFourMemeTokenMetadata(
  address: string,
): Promise<FourMemeTokenMetadata | null> {
  const tokenDetailsUrl = `https://four.meme/meme-api/v1/private/token/get?address=${address}`;
  try {
    const tokenDetails = await fetch(tokenDetailsUrl);
    const response: FourMemeTokenDetailsResponse = await handleJSONResponse(
      tokenDetails,
    );
    return response.data;
  } catch {
    return null;
  }
}

export function getFourMemeInput(
  input: ISwapAssetInput,
): FourMemeInput | undefined {
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

export async function getTransactionFromFourMemeRoute(
  wallet: IWallet,
  minOutAmount: string,
  route: FourMemeRoute,
): Promise<SwapTransaction[]> {
  if (route.txType === 'buy') {
    const swapTx: SwapTransaction = {
      type: 'swap',
      data: getPurchaseTokenTransactionData(
        route.outputMint,
        route.inAmount,
        route.buyAmountWithPlatformFee!,
        minOutAmount,
      ),
      chainId: ChainId.BinanceSmartChain,
    };
    return [swapTx];
  }
  if (route.txType === 'sell') {
    if (BigInt(route.outAmount) < ethers.parseUnits('0.00001', 18)) {
      throw new Error(
        'Order size is too small, Insufficient BNB swapped for four.meme fee',
      );
    }
    const approvalAmount = await tokenApproval({
      address: wallet.address,
      chainId: ChainId.BinanceSmartChain,
      tokenAddress: route.inputMint,
      approvalAddress: fourMemeContractAddress,
    });

    const hasApproval = BigInt(approvalAmount) >= BigInt(route.inAmount);
    const txs: SwapTransaction[] = [];
    if (!hasApproval) {
      txs.push({
        type: 'approve',
        data: getERC20ApprovalTransactionData(
          route.inputMint,
          fourMemeContractAddress,
          route.inAmount,
        ),
        chainId: ChainId.BinanceSmartChain,
        approvalAddress: fourMemeContractAddress,
      });
    }
    const swapTx: SwapTransaction = {
      type: 'swap',
      data: getSaleTokenTransactionData(route.inputMint, route.inAmount),
      chainId: ChainId.BinanceSmartChain,
    };
    txs.push(swapTx);

    return txs;
  }
  return [];
}
