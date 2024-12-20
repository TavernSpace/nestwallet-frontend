import {
  Asset,
  Factory,
  MAINNET_FACTORY_ADDR,
  VaultJetton,
  VaultNative,
} from '@dedust/sdk';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { useQuery } from '@tanstack/react-query';
import { Address, beginCell, toNano, TonClient } from '@ton/ton';
import { ethers } from 'ethers';
import {
  DeDustRoute,
  DeDustRouteInput,
  DeDustToken,
} from '../../../common/api/dedust/types';
import {
  getDeDustRoute,
  getDeDustTokens,
} from '../../../common/api/dedust/utils';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { tonFeeAddress } from '../../tvm/constants';
import {
  generateQueryId,
  getJettonTransferBody,
} from '../../tvm/contract/encode';
import { getJettonAccount } from '../../tvm/utils';
import { ExternalSwapToken, ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

export function getDeDustRouteInput(
  input: ISwapAssetInput,
  mode: QuickTradeMode,
) {
  if (!isInputValid(input)) return;
  const bigAmount = ethers.parseUnits(
    input.amount,
    input.fromAsset!.tokenMetadata.decimals,
  );
  // TODO(TON): add fees
  const sendAmount =
    mode === 'buy'
      ? (bigAmount * 10000n - bigAmount * BigInt(input.fee)) / 10000n
      : bigAmount;
  return {
    from: input.fromAsset!.address!,
    fromDecimals: input.fromAsset!.tokenMetadata.decimals,
    to: input.toAsset!.address!,
    toDecimals: input.toAsset!.tokenMetadata.decimals,
    amount: bigAmount.toString(),
  };
}

export function useDeDustRoutesQuery(
  input: DeDustRouteInput | undefined,
  options: QueryOptions,
) {
  return useQuery({
    queryKey: ['deDustRoutesQuery', input],
    queryFn: async () => getDeDustRoute(input!),
    ...options,
    enabled: options.enabled && !!input,
  });
}

export function useDeDustTokensQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['deDustTokensQuery'],
    queryFn: async () => getDeDustTokens(),
    ...options,
  });
}

export function isDeDustToken(token: ExternalSwapToken): token is DeDustToken {
  return 'aliased' in token;
}

export async function getTransactionFromDeDustRoute(
  wallet: IWallet,
  input: ISwapAssetInput,
  route: DeDustRoute,
): Promise<SwapTransaction[]> {
  const endpoint = await getHttpEndpoint();
  const tonClient = new TonClient({
    endpoint,
  });
  const factory = tonClient.open(
    Factory.createFromAddress(MAINNET_FACTORY_ADDR),
  );
  const isMultiHop = route.length !== 1;
  // TODO: support multihop
  if (isMultiHop) {
    throw new Error('Invalid route');
  }
  const swap = route[0]!;
  const isNativeInput = swap.assetIn === 'native';
  const slippage = BigInt(Math.round(10000 - input.slippage * 100));
  const minAmountOut = (BigInt(swap.amountOut) * slippage) / 10000n;
  if (isNativeInput) {
    const nativeVault = tonClient.open(
      VaultNative.createFromAddress(
        await factory.getVaultAddress(Asset.native()),
      ),
    );
    validatePoolAndVault(
      tonClient,
      swap.pool.address,
      nativeVault.address.toString({ urlSafe: true, bounceable: true }),
    );
    return [
      {
        data: {
          to: nativeVault.address.toString({ bounceable: true, urlSafe: true }),
          value: (BigInt(swap.amountIn) + toNano(0.2)).toString(),
          data: dedustNativeToJettonBody(
            BigInt(swap.amountIn),
            Address.parse(swap.pool.address),
            minAmountOut,
          )
            .toBoc()
            .toString('base64'),
        },
        chainId: ChainId.Ton,
        type: 'swap',
      },
    ];
  } else {
    const jetton = Address.parseRaw(swap.assetIn.slice(7));
    const vault = tonClient.open(await factory.getJettonVault(jetton));
    validatePoolAndVault(
      tonClient,
      swap.pool.address,
      vault.address.toString({ urlSafe: true, bounceable: true }),
    );
    const jettonAccount = await getJettonAccount(
      wallet,
      jetton.toString({ urlSafe: true, bounceable: true }),
    );
    return [
      {
        data: {
          to: jettonAccount.toString(),
          value: toNano(0.3).toString(),
          data: getJettonTransferBody(
            vault.address.toString({ bounceable: true, urlSafe: true }),
            wallet.address,
            BigInt(swap.amountIn),
            generateQueryId(),
            toNano(0.25),
            VaultJetton.createSwapPayload({
              poolAddress: Address.parse(swap.pool.address),
              limit: minAmountOut,
            }),
          )
            .toBoc()
            .toString('base64'),
        },
        chainId: ChainId.Ton,
        type: 'swap',
      },
    ];
  }
}

function dedustNativeToJettonBody(
  amount: bigint,
  pool: Address,
  limit: bigint,
) {
  const ref = beginCell()
    .storeUint(0, 32)
    .storeAddress(null)
    .storeAddress(Address.parse(tonFeeAddress))
    .storeMaybeRef(undefined)
    .storeMaybeRef(undefined)
    .endCell();
  return beginCell()
    .storeUint(VaultNative.SWAP, 32)
    .storeUint(generateQueryId(), 64)
    .storeCoins(amount)
    .storeAddress(pool)
    .storeUint(0, 1)
    .storeCoins(limit)
    .storeMaybeRef(null)
    .storeRef(ref)
    .endCell();
}

async function validatePoolAndVault(
  tonClient: TonClient,
  pool: string,
  vault: string,
) {
  const [poolState, vaultState] = await Promise.all([
    tonClient.getContractState(Address.parse(pool)),
    tonClient.getContractState(Address.parse(vault)),
  ]);
  if (poolState.state !== 'active') {
    throw new Error('Pool does not exist');
  } else if (vaultState.state !== 'active') {
    throw new Error('Vault does not exist');
  }
}
