import { PublicKey } from '@solana/web3.js';
import {
  useQuery,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { isNil, uniqBy } from 'lodash';
import { useState } from 'react';
import { DeDustToken } from '../../common/api/dedust/types';
import { JupiterToken } from '../../common/api/jupiter/types';
import { LifiToken } from '../../common/api/lifi/types';
import { NestWalletClient } from '../../common/api/nestwallet/client';
import { StonFiToken } from '../../common/api/stonfi/types';
import { fetchGraphql } from '../../common/hooks/graphql';
import { DefinedType, Loadable } from '../../common/types';
import { collect, recordify } from '../../common/utils/functions';
import { QueryOptions } from '../../common/utils/query';
import {
  FeeDataDocument,
  IBlockchainType,
  ICryptoBalance,
  IFeeDataQuery,
  IFeeDataQueryVariables,
  ITxType,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { useNestWallet } from '../../provider/nestwallet';
import { ILimitOrderInput } from '../../screens/quick-trade/types';
import { defaultCommonBalance } from '../../screens/quick-trade/utils';
import {
  ChainId,
  getChainInfo,
  onBlockchain,
  swapSupportedChainsForBlockchain,
} from '../chain';
import { cryptoKey, isNativeAddress } from '../crypto/utils';
import { nullAddress } from '../evm/constants';
import { nativeSolAddress } from '../svm/constants';
import { nativeTonAddress } from '../tvm/constants';
import { isDeDustToken } from './dedust/utils';
import { getMoonshotProgram, moonshotKeys } from './moonshot/moonshot';
import { getPumpFunProgram, pumpFunKeys } from './pump-fun/pump-fun';
import { isProxyTon, isStonFiToken } from './stonfi/utils';
import {
  ExternalSwapToken,
  IQuickTradeAssetInput,
  ISwapAssetInput,
  SvmTokenType,
  SwapRoute,
  useQueryHookSignature,
} from './types';

export function getSwapAssetInputError(swapAssetInput: ISwapAssetInput) {
  if (!swapAssetInput.fromAsset) {
    return undefined;
  }
  const fromAssetBalance = parseFloat(
    ethers.formatUnits(
      swapAssetInput.fromAsset.balance,
      swapAssetInput.fromAsset.tokenMetadata.decimals,
    ),
  );
  if (swapAssetInput.amount === '.') {
    return 'Please enter a valid amount';
  } else if (
    parseFloat(swapAssetInput.amount) === 0 ||
    swapAssetInput.amount === ''
  ) {
    return 'Enter a non-zero amount to swap';
  } else if (parseFloat(swapAssetInput.amount) > fromAssetBalance) {
    return 'Insufficient funds';
  } else if (!swapAssetInput.toAccount) {
    return 'Select a bridge destination';
  } else {
    return undefined;
  }
}

export function getSwapAssetError(
  swapAssetInput: ISwapAssetInput,
  route: Loadable<SwapRoute | null>,
) {
  const inputError = getSwapAssetInputError(swapAssetInput);
  if (inputError) {
    return inputError;
  } else if (route.error || (route.success && route.data === null)) {
    return 'No route found';
  } else {
    return undefined;
  }
}

export function useDependentQuery<TVariable, TData, TError = unknown>(
  useQueryHook: useQueryHookSignature<TVariable, TData, TError>,
  input: TVariable | null | undefined,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey'>,
): UseQueryResult<TData, TError> {
  return useQueryHook((input ?? {}) as TVariable, {
    ...options,
    enabled: options?.enabled !== false && !!input,
  });
}

export function resolveLoadable<
  TData extends DefinedType,
  TReturn extends DefinedType,
>(
  loadable: Loadable<TData | null>,
  transform: (data: TData) => TReturn | null | undefined,
): TReturn | null | undefined {
  if (loadable.success && loadable.data) {
    return transform(loadable.data);
  }
  return undefined;
}

export function isInputValid(input: ISwapAssetInput) {
  return (
    input.amount !== '' &&
    input.amount !== '.' &&
    !!input.toAccount &&
    parseFloat(input.amount) !== 0 &&
    !!input.fromAsset &&
    !!input.toAsset &&
    (input.fromAsset.address !== input.toAsset.address ||
      input.fromAsset.chainId !== input.toAsset.chainId)
  );
}

export function isLimitInputValid(input: ILimitOrderInput) {
  return (
    input.amount !== '' &&
    input.amount !== '.' &&
    parseFloat(input.amount) !== 0 &&
    !!input.fromAsset &&
    !!input.toAsset &&
    input.targetPrice !== '' &&
    input.targetPrice !== '.' &&
    parseFloat(input.targetPrice) !== 0 &&
    input.fromAsset.address !== input.toAsset.address
  );
}

export function cryptoBalanceToSwapToken(asset: ICryptoBalance) {
  return {
    chainId: ChainId.Solana,
    address: asset.address,
    symbol: asset.tokenMetadata.symbol,
    decimals: asset.tokenMetadata.decimals,
    name: asset.tokenMetadata.name,
    logoURI: asset.tokenMetadata.imageUrl,
    priceUSD: asset.tokenMetadata.price,
  };
}

export function getSwappableTokens(
  crypto: ICryptoBalance[],
  tokens: Record<string, ExternalSwapToken[]>,
  blockchain: IBlockchainType,
) {
  const results = collect(crypto, (item) => item.chainId);
  // add tokens not already in results
  const ownedCrypto = recordify(crypto, (item) => cryptoKey(item));
  const commonMap: Record<
    string,
    {
      name: string;
      symbol: string;
      imageUrl: string;
      decimals: number;
    }
  > = {};
  Object.keys(tokens).forEach((key) => {
    const chainId = parseInt(key);
    const chainInfo = getChainInfo(chainId);
    commonMap[
      cryptoKey({
        address: onBlockchain(blockchain)(
          () => nullAddress,
          () => nativeSolAddress,
          () => nativeTonAddress,
        ),
        chainId,
      })
    ] = chainInfo.nativeCurrency;
    commonMap[cryptoKey({ address: chainInfo.wrappedToken.address, chainId })] =
      chainInfo.wrappedToken;
    chainInfo.stablecoins.forEach((coin) => {
      commonMap[cryptoKey({ address: coin.address, chainId })] = coin;
    });
    tokens[key]!.forEach((token) => {
      const isStonFi = isStonFiToken(token);
      const isDeDust = isDeDustToken(token);
      const address = isStonFi ? token.contract_address : token.address;
      const key = cryptoKey(
        isStonFi || isDeDust
          ? { address: address ?? nativeTonAddress, chainId: ChainId.Ton }
          : token,
      );
      const cryptoBalance = ownedCrypto[key];
      if (cryptoBalance) return;
      const commonData = commonMap[key];
      const data = isStonFi
        ? parseStonFiToken(token, commonData)
        : isDeDust
        ? parseDeDustToken(token)
        : parseJupiterAndLifiToken(token, commonData);
      if (!results[chainId]) {
        results[chainId] = [data];
      } else {
        results[chainId]!.push(data);
      }
    });
  });
  results[0] = cryptoWithDefault(crypto, blockchain);
  return results;
}

export function getDefaultSwappableTokens(
  crypto: ICryptoBalance[],
  blockchain: IBlockchainType,
) {
  return collect(cryptoWithDefault(crypto, blockchain), (item) => item.chainId);
}

function cryptoWithDefault(
  crypto: ICryptoBalance[],
  blockchain: IBlockchainType,
) {
  const cryptoMap = recordify(crypto, (item) => cryptoKey(item));
  const defaultAssets = [...crypto];
  if (blockchain === IBlockchainType.Evm) {
    const swapChains = swapSupportedChainsForBlockchain[IBlockchainType.Evm];
    swapChains.forEach((chain) => {
      const defaults: ICryptoBalance[] = [
        defaultCommonBalance(chain.nativeCurrency, chain.id),
        defaultCommonBalance(chain.wrappedToken, chain.id),
        ...chain.stablecoins.map((coin) =>
          defaultCommonBalance(coin, chain.id),
        ),
      ];
      defaults.forEach((item) => {
        if (!cryptoMap[cryptoKey(item)]) {
          defaultAssets.push(item);
        }
      });
    });
    return defaultAssets;
  } else {
    return defaultAssets;
  }
}

function parseStonFiToken(
  token: StonFiToken,
  commonData?: {
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
  },
) {
  const isProxy = isProxyTon(token.contract_address);
  const address = isProxy ? nativeTonAddress : token.contract_address;
  const hasCommon = !!commonData;
  const metadata = hasCommon
    ? {
        ...commonData,
        id: '',
        address,
        isNativeToken: isProxy,
        price: token.dex_price_usd ?? '0',
      }
    : {
        id: '',
        address,
        decimals: token.decimals,
        imageUrl: token.image_url ?? '',
        isNativeToken: isProxy,
        name: token.display_name || token.symbol,
        price: token.dex_price_usd ?? '0',
        symbol: token.symbol,
      };
  return {
    address,
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId: ChainId.Ton,
    tokenMetadata: metadata,
  };
}

function parseDeDustToken(
  token: DeDustToken,
  commonData?: {
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
  },
) {
  const address = token.address ?? nativeTonAddress;
  const hasCommon = !!commonData;
  const metadata = hasCommon
    ? {
        ...commonData,
        id: '',
        address,
        isNativeToken: address === null,
        price: '0',
      }
    : {
        id: '',
        address,
        decimals: token.decimals,
        imageUrl: token.image ?? '',
        isNativeToken: address === null,
        name: token.name || token.symbol,
        price: '0',
        symbol: token.symbol,
      };
  return {
    address,
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId: ChainId.Ton,
    tokenMetadata: metadata,
  };
}

function parseJupiterAndLifiToken(
  token: LifiToken | JupiterToken,
  commonData?: {
    name: string;
    symbol: string;
    imageUrl: string;
    decimals: number;
  },
) {
  const address = token.address;
  const hasCommon = !!commonData;
  const metadata = hasCommon
    ? {
        ...commonData,
        id: '',
        address,
        isNativeToken: isNativeAddress(token.address),
        price: token.priceUSD || '0',
      }
    : {
        id: '',
        address,
        decimals: token.decimals,
        imageUrl: token.logoURI ?? '',
        isNativeToken: isNativeAddress(token.address),
        name: token.name || token.symbol || '',
        price: token.priceUSD || '0',
        symbol: token.symbol || token.name || '',
      };
  return {
    address,
    balance: '0',
    balanceChange: { absolute1D: 0, percent1D: 0 },
    balanceInUSD: '0',
    chainId: token.chainId,
    tokenMetadata: metadata,
  };
}

export function getCommonOwnedTokens(
  chainId: number,
  crypto: ICryptoBalance[],
  ignoreWrapped = false,
) {
  const chainInfo = getChainInfo(chainId);
  const commonTokens = [
    defaultCommonBalance(chainInfo.nativeCurrency, chainId),
    ...(chainId !== ChainId.Ton && !ignoreWrapped
      ? [defaultCommonBalance(chainInfo.wrappedToken, chainId)]
      : []),
    ...chainInfo.stablecoins.map((coin) => {
      const balance = defaultCommonBalance(coin, chainId);
      balance.tokenMetadata.price = '1.00';
      return balance;
    }),
  ];
  const commonTokenMap = recordify(commonTokens, (balance) => balance.address);
  return uniqBy(
    crypto
      .filter(
        (crypto) =>
          crypto.chainId === chainId && commonTokenMap[crypto.address],
      )
      .concat(commonTokens),
    (item) => item.address,
  );
}

export function useSwapInputFormik(props: {
  wallet: IWallet;
  initialAsset?: ICryptoBalance;
  initialChainId?: number;
  initialToAsset?: ICryptoBalance;
  slippage?: number;
  fee: number;
  infiniteApproval: boolean;
  simulate: boolean;
  onSubmit: (values: ISwapAssetInput) => Promise<void>;
}) {
  const {
    wallet,
    initialAsset,
    initialChainId,
    initialToAsset,
    infiniteApproval,
    slippage = 0.5,
    simulate,
    fee,
    onSubmit,
  } = props;
  const chainId =
    initialChainId ||
    initialAsset?.chainId ||
    wallet.chainId ||
    onBlockchain(wallet.blockchain)(
      () => ChainId.Ethereum,
      () => ChainId.Solana,
      () => ChainId.Ton,
    );
  const formik = useFormik<ISwapAssetInput>({
    initialValues: {
      relay: false,
      amount: '',
      description: '',
      slippage,
      infiniteApproval,
      simulate,
      fromChainId: chainId,
      toChainId: chainId,
      fromAsset: initialAsset,
      toAsset: initialToAsset,
      toAccount: {
        address: wallet.address,
        wallet,
      },
      fee,
      disabled: false,
    },
    validateOnChange: false,
    onSubmit,
  });
  return { formik };
}

// Note: we avoid using formik because the quick trade screens are complex
// and using formik causes lag
export function useQuickTradeInput(initial: {
  wallet: IWallet;
  initialAsset?: ICryptoBalance;
  initialChainId?: number;
  slippage?: number;
}) {
  // common
  const [amount, setAmount] = useState('');
  const [fromAsset, setFromAsset] = useState(initial.initialAsset);
  const [toAsset, setToAsset] = useState<ICryptoBalance>();
  const [chainId, setChainId] = useState(initial.initialChainId);
  const [slippage, setSlippage] = useState(initial.slippage ?? 20);

  const handleChangeInput = (input: IQuickTradeAssetInput) => {
    if (!isNil(input.amount)) {
      setAmount(input.amount);
    }
    if (!isNil(input.fromAsset)) {
      setFromAsset(input.fromAsset);
    }
    if (!isNil(input.toAsset)) {
      setToAsset(input.toAsset);
    }
    if (!isNil(input.chainId)) {
      setChainId(input.chainId);
    }
    if (!isNil(input.slippage)) {
      setSlippage(input.slippage);
    }
  };
  return {
    input: { amount, fromAsset, toAsset, chainId, slippage },
    setQuickTradeInput: handleChangeInput,
  };
}

export const getDefaultSwapGasLimit = (chainId: number) => {
  return BigInt(
    chainId === ChainId.Ethereum
      ? 200000
      : chainId === ChainId.Arbitrum ||
        chainId === ChainId.Base ||
        chainId === ChainId.Blast
      ? 600000
      : 400000,
  );
};

async function getGasFees(
  client: NestWalletClient,
  chainId: number,
  data: string,
  txType?: ITxType,
) {
  const feeDataResponse = await fetchGraphql<
    IFeeDataQuery,
    IFeeDataQueryVariables
  >(client, FeeDataDocument, {
    input: { chainId, data, txType },
  });
  return feeDataResponse.feeData;
}

export async function getFeeData(
  client: NestWalletClient,
  inputs: { chainId: number; data: string; txType?: ITxType }[],
) {
  return Promise.all(
    inputs.map((input) =>
      getGasFees(client, input.chainId, input.data, input.txType),
    ),
  );
}

export function useBulkFeeDataQuery(
  inputs: { chainId: number; data: string; txType?: ITxType }[],
  options?: QueryOptions,
) {
  const { apiClient } = useNestWallet();
  return useQuery({
    queryKey: ['queryFeeDataBulk', inputs],
    queryFn: () => (inputs.length === 0 ? [] : getFeeData(apiClient, inputs)),
    ...options,
  });
}

export function useSvmTokenTypeQuery(
  input?: ICryptoBalance,
  options?: QueryOptions,
) {
  return useQuery({
    queryKey: ['svmTokenTypeQuery', input],
    queryFn: async () => getSvmTokenType(input!.address),
    ...options,
    enabled: options?.enabled !== false && !!input,
  });
}

async function getSvmTokenType(mint: string): Promise<SvmTokenType> {
  const mintPubKey = new PublicKey(mint);
  try {
    const [pumpfunBondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPubKey.toBuffer()],
      pumpFunKeys.PUMP_FUN_PROGRAM_ID,
    );
    const pumpFunProgram = getPumpFunProgram();
    const pumpFunBondingCurveData =
      await pumpFunProgram.account.bondingCurve!.fetch(pumpfunBondingCurve);
    if (!!pumpFunBondingCurveData && !pumpFunBondingCurveData.complete) {
      return 'pumpfun';
    }
  } catch {
    /* empty */
  }
  try {
    const [moonshotBondingCurve] = PublicKey.findProgramAddressSync(
      [Buffer.from('token'), mintPubKey.toBuffer()],
      moonshotKeys.MOONSHOT_PROGRAM_ID,
    );
    const moonshotProgram = getMoonshotProgram();
    const moonshotBondingCurveData =
      await moonshotProgram.account.curveAccount!.fetch(moonshotBondingCurve);
    if (moonshotBondingCurveData) {
      return 'moonshot';
    }
  } catch (e) {
    /* empty */
  }
  return 'jupiter';
}

export function useSolanaDexes(options?: QueryOptions) {
  const { apiClient } = useNestWallet();
  return useQuery({
    queryKey: ['jupiterDexesQuery'],
    queryFn: async () => apiClient.getSolanaDexes(),
    ...options,
  });
}
