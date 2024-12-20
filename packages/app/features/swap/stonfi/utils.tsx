import { getHttpEndpoint } from '@orbs-network/ton-access';
import { DEX, pTON } from '@ston-fi/sdk';
import { useQuery } from '@tanstack/react-query';
import { TonClient } from '@ton/ton';
import { ethers } from 'ethers';
import {
  StonFiRoute,
  StonFiRoutesInput,
  StonFiToken,
} from '../../../common/api/stonfi/types';
import {
  getStonFiRoute,
  getStonFiTokens,
} from '../../../common/api/stonfi/utils';
import { QueryOptions } from '../../../common/utils/query';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { QuickTradeMode } from '../../../screens/quick-trade/types';
import { ChainId } from '../../chain';
import { isNativeAddress } from '../../crypto/utils';
import { generateQueryId } from '../../tvm/contract/encode';
import { ExternalSwapToken, ISwapAssetInput, SwapTransaction } from '../types';
import { isInputValid } from '../utils';

export function getStonFiRouteInput(
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
    offer_address: input.fromAsset!.address!,
    ask_address: input.toAsset!.address!,
    units: bigAmount.toString(),
    slippage_tolerance: (input.slippage / 100).toString(),
    referral_address: undefined,
  };
}

export function useStonFiRoutesQuery(
  input: StonFiRoutesInput | undefined,
  options: QueryOptions,
) {
  return useQuery({
    queryKey: ['stonFiRoutesQuery', input],
    queryFn: async () => getStonFiRoute(input!),
    ...options,
    enabled: options.enabled && !!input,
  });
}

export function useStonFiTokensQuery(options?: QueryOptions) {
  return useQuery({
    queryKey: ['stonFiTokensQuery'],
    queryFn: async () => getStonFiTokens(),
    ...options,
  });
}

export function isStonFiToken(token: ExternalSwapToken): token is StonFiToken {
  return 'contract_address' in token;
}

export function isProxyTon(address: string) {
  return address === 'EQDwpyxrmYQlGDViPk-oqP4XK6J11I-bx7fJAlQCWmJB4tVy';
}

export function getProxyTon() {
  const proxyTon = new pTON.v1();
  return proxyTon.address.toString({ urlSafe: true, bounceable: true });
}

export function getProxyTonV2() {
  const proxyTon = pTON.v2.create(
    'kQDwpyxrmYQlGDViPk-oqP4XK6J11I-bx7fJAlQCWmJB4m74', // pTON v2.0.0
  );
  return proxyTon.address.toString({ urlSafe: true, bounceable: true });
}

export async function getTransactionFromStonFiRoute(
  wallet: IWallet,
  route: StonFiRoute,
): Promise<SwapTransaction[]> {
  const endpoint = await getHttpEndpoint();
  const tonClient = new TonClient({
    endpoint,
  });
  const router = tonClient.open(new DEX.v1.Router());
  const proxyTon = new pTON.v1();
  const txParams = isNativeAddress(route.offer_address)
    ? await router.getSwapTonToJettonTxParams({
        userWalletAddress: wallet.address,
        askJettonAddress: route.ask_address,
        offerAmount: route.offer_units,
        proxyTon,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      })
    : isNativeAddress(route.ask_address)
    ? await router.getSwapJettonToTonTxParams({
        userWalletAddress: wallet.address,
        offerJettonAddress: route.offer_address,
        offerAmount: route.offer_units,
        proxyTon,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      })
    : await router.getSwapJettonToJettonTxParams({
        userWalletAddress: wallet.address,
        offerJettonAddress: route.offer_address,
        offerAmount: route.offer_units,
        askJettonAddress: route.ask_address,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      });
  return [
    {
      data: {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        data: txParams.body?.toBoc().toString('base64') ?? '',
      },
      chainId: ChainId.Ton,
      type: 'swap',
    },
  ];
}

export async function getTransactionFromStonFiRouteV2(
  wallet: IWallet,
  route: StonFiRoute,
): Promise<SwapTransaction[]> {
  const endpoint = await getHttpEndpoint();
  const tonClient = new TonClient({
    endpoint,
  });
  const router = tonClient.open(
    DEX.v2.Router.create(
      'kQCas2p939ESyXM_BzFJzcIe3GD5S0tbjJDj6EBVn-SPsEkN', // CPI Router v2.0.0
    ),
  );
  const proxyTon = pTON.v2.create(
    'kQDwpyxrmYQlGDViPk-oqP4XK6J11I-bx7fJAlQCWmJB4m74', // pTON v2.0.0
  );
  const txParams = isProxyTon(route.offer_address)
    ? await router.getSwapTonToJettonTxParams({
        userWalletAddress: wallet.address,
        askJettonAddress: route.ask_address,
        offerAmount: route.offer_units,
        proxyTon,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      })
    : isProxyTon(route.ask_address)
    ? await router.getSwapJettonToTonTxParams({
        userWalletAddress: wallet.address,
        offerJettonAddress: route.offer_address,
        offerAmount: route.offer_units,
        proxyTon,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      })
    : await router.getSwapJettonToJettonTxParams({
        userWalletAddress: wallet.address,
        offerJettonAddress: route.offer_address,
        offerAmount: route.offer_units,
        askJettonAddress: route.ask_address,
        minAskAmount: route.min_ask_units,
        queryId: generateQueryId(),
      });
  return [
    {
      data: {
        to: txParams.to.toString(),
        value: txParams.value.toString(),
        data: txParams.body?.toBoc().toString('base64') ?? '',
      },
      chainId: ChainId.Ton,
      type: 'swap',
    },
  ];
}
