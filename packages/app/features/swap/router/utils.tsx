import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import {
  RouterQuoteInput,
  RouterRoute,
} from '../../../common/api/router/types';
import {
  getRouterRoute,
  getRouterTransaction,
} from '../../../common/api/router/utils';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { tokenApproval } from '../../crypto/approval';
import { nullAddress } from '../../evm/constants';
import { getERC20ApprovalTransactionData } from '../../evm/contract/encode';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

const routerNativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export function getRouterRouteInput(input: ISwapAssetInput) {
  if (!isInputValid(input)) return;
  const fromAsset = input.fromAsset!;
  const toAsset = input.toAsset!;
  return {
    amount: ethers
      .parseUnits(input.amount, fromAsset.tokenMetadata.decimals)
      .toString(),
    fromTokenAddress: convertToRouterAddress(fromAsset.address),
    fromTokenChainId: convertToRouterChainId(input.fromChainId),
    toTokenAddress: convertToRouterAddress(toAsset.address),
    toTokenChainId: convertToRouterChainId(input.toChainId),
    slippageTolerance: input.slippage.toString(),
    destFuel: '0',
  };
}

export function useRouterRoutesQuery(
  input: RouterQuoteInput | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['routerRoutesQuery', input],
    queryFn: async () => getRouterRoute(input!),
    ...options,
    enabled: options?.enabled !== false && !!input,
  });
}

export async function getTransactionFromRouterRoute(
  wallet: IWallet,
  route: RouterRoute,
): Promise<SwapTransaction[]> {
  const resp = await getRouterTransaction({
    ...route,
    senderAddress: wallet.address,
    receiverAddress: wallet.address,
  });
  const chainId = parseInt(route.source.chainId);
  const fromTokenAddress = normalizeRouterAddress(route.fromTokenAddress);
  const approvalAmount = await tokenApproval({
    address: wallet.address,
    chainId,
    tokenAddress: fromTokenAddress,
    approvalAddress: route.allowanceTo,
  });
  const hasApproval =
    BigInt(approvalAmount) >= BigInt(route.source.tokenAmount);
  const txs: SwapTransaction[] = [];
  if (!hasApproval) {
    txs.push({
      type: 'approve',
      chainId,
      data: getERC20ApprovalTransactionData(
        fromTokenAddress,
        route.allowanceTo,
        route.source.tokenAmount,
      ),
      approvalAddress: route.allowanceTo,
    });
  }
  txs.push({
    type: 'swap',
    chainId,
    data: {
      to: ethers.getAddress(resp.txn.to),
      data: resp.txn.data,
      value: resp.txn.value,
    },
  });
  return txs;
}

function convertToRouterChainId(chainId: number) {
  return chainId === ChainId.Solana ? 'solana' : chainId.toString();
}

function convertToRouterAddress(address: string) {
  return address === nullAddress ? routerNativeTokenAddress : address;
}

function normalizeRouterAddress(address: string) {
  return address === routerNativeTokenAddress ? nullAddress : address;
}
