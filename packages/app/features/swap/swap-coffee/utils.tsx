import { useQuery } from '@tanstack/react-query';
import {
  SwapCoffeeRoute,
  SwapCoffeeRouteInput,
} from '../../../common/api/swap-coffee/types';
import {
  getSwapCoffeeRoute,
  getSwapCoffeeTransactions,
} from '../../../common/api/swap-coffee/utils';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { ChainId } from '../../chain';
import { nativeTonAddress } from '../../tvm/constants';
import { ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

export function getSwapCoffeeInput(
  input: ISwapAssetInput,
): SwapCoffeeRouteInput | undefined {
  if (!isInputValid(input)) return;

  return {
    input_token: {
      blockchain: 'ton',
      address: getSwapCoffeeTokenAddress(input.fromAsset!.address),
    },
    output_token: {
      blockchain: 'ton',
      address: getSwapCoffeeTokenAddress(input.toAsset!.address),
    },
    input_amount: parseFloat(input.amount),
  };
}

function getSwapCoffeeTokenAddress(address: string) {
  return address === nativeTonAddress ? 'native' : address;
}

export function useSwapCoffeeRoutesQuery(
  input: SwapCoffeeRouteInput | undefined,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['swapCoffeeRoutesQuery', input],
    queryFn: async () => getSwapCoffeeRoute(input!),
    ...options,
    enabled: options?.enabled !== false && !!input,
  });
}

export async function getTransactionFromSwapCoffeeRoute(
  wallet: IWallet,
  route: SwapCoffeeRoute,
  slippage: number,
): Promise<SwapTransaction[]> {
  const resp = await getSwapCoffeeTransactions({
    sender_address: wallet.address,
    slippage: slippage / 100,
    paths: route.paths,
  });
  return resp.transactions.map((transaction) => ({
    data: {
      to: transaction.address,
      value: transaction.value,
      data: transaction.cell,
    },
    chainId: ChainId.Ton,
    type: 'swap',
  }));
}
