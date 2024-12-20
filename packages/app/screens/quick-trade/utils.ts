import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { clamp } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { delay } from '../../common/api/utils';
import { usePrevious } from '../../common/hooks/utils';
import { CustomGasSettings, Tuple } from '../../common/types';
import { tuple } from '../../common/utils/functions';
import { ChainId, ChainInfo, getChainInfo } from '../../features/chain';
import { latestBalanceQueryKey } from '../../features/crypto/balance';
import {
  getMaxBalanceMinusGas,
  validDecimalAmount,
} from '../../features/crypto/transfer';
import { cryptoKey, isNativeAddress } from '../../features/crypto/utils';
import { SwapPresets } from '../../features/swap/types';
import {
  getCommonOwnedTokens,
  isLimitInputValid,
} from '../../features/swap/utils';
import {
  ICryptoBalance,
  ICryptoPositionInputType,
  IGasLevel,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { customGasLevel, gasLevelMap } from '../../molecules/gas/utils';
import { useExecutionContext } from '../../provider/execution';
import {
  BasicTokenInfo,
  CustomGasLevelMap,
  ILimitOrderInput,
  LimitForm,
  QuickTradeMode,
  SlippageMap,
  SpotForm,
} from './types';

export function defaultCryptoBalance(asset: BasicTokenInfo): ICryptoBalance {
  return {
    address: asset.address,
    balance: '0',
    balanceChange: {
      absolute1D: 0,
      percent1D: 0,
    },
    balanceInUSD: '0.00',
    chainId: asset.chainId,
    tokenMetadata: {
      address: asset.address,
      decimals: asset.decimals,
      id: asset.address,
      imageUrl: asset.logo ?? '',
      isNativeToken: isNativeAddress(asset.address),
      name: asset.name,
      symbol: asset.symbol,
      price: asset.price || '0',
    },
  };
}

export function defaultCommonBalance(
  asset: ChainInfo['wrappedToken'],
  chainId: number,
): ICryptoBalance {
  return defaultCryptoBalance({
    address: asset.address,
    chainId,
    symbol: asset.symbol,
    decimals: asset.decimals,
    name: asset.name,
    logo: asset.imageUrl,
  });
}

export function cryptoBalanceToBasicInfo(crypto: ICryptoBalance) {
  return {
    address: crypto.address,
    chainId: crypto.chainId,
    price: crypto.tokenMetadata.price,
    symbol: crypto.tokenMetadata.symbol,
    decimals: crypto.tokenMetadata.decimals,
    name: crypto.tokenMetadata.name,
    logo: crypto.tokenMetadata.imageUrl,
  };
}

export function defaultPresets(asset?: ICryptoBalance) {
  if (!asset) return tuple('10', '50', '100');
  const chainId = asset.chainId;
  const chainInfo = getChainInfo(chainId);
  const isEthChain =
    [
      ChainId.Arbitrum,
      ChainId.Base,
      ChainId.Blast,
      ChainId.Ethereum,
      ChainId.Optimism,
      ChainId.Scroll,
    ].find((id) => id === chainId) !== undefined;
  const isBaseAsset =
    asset.tokenMetadata.isNativeToken ||
    chainInfo.wrappedToken.address === asset.address;
  if (isBaseAsset && isEthChain) {
    return tuple('0.01', '0.1', '0.5');
  } else if (isBaseAsset && chainId === ChainId.Avalanche) {
    return tuple('0.5', '1', '5');
  } else if (isBaseAsset && chainId === ChainId.Polygon) {
    return tuple('10', '50', '100');
  } else if (isBaseAsset && chainId === ChainId.BinanceSmartChain) {
    return tuple('0.1', '1', '2');
  } else if (isBaseAsset && chainId === ChainId.Solana) {
    return tuple('0.1', '1', '3');
  } else if (isBaseAsset && chainId === ChainId.Ton) {
    return tuple('3', '10', '50');
  } else {
    return tuple('10', '50', '100');
  }
}

export function getDefaultSecondaryAsset(
  asset: ICryptoBalance,
  crypto: ICryptoBalance[],
) {
  const chain = getChainInfo(asset.chainId);
  const isNative = asset.tokenMetadata.isNativeToken;
  const isWrapped = asset.tokenMetadata.address === chain.wrappedToken.address;
  return getCommonOwnedTokens(asset.chainId, crypto).find(
    (token) =>
      token.address !== asset.address &&
      token.address !== chain.wrappedToken.address &&
      (isNative || isWrapped
        ? !token.tokenMetadata.isNativeToken
        : token.tokenMetadata.isNativeToken),
  );
}

export function useVerifyQuickTradeTransactions(wallet: IWallet) {
  const { subscribe } = useExecutionContext();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribe((chainId) => {
      if (chainId === 0) {
        return;
      } else if (chainId === ChainId.Solana || chainId === ChainId.Ton) {
        const invalidate = async (time: number) => {
          await delay(time);
          await queryClient.invalidateQueries({
            queryKey: [
              'CryptoPositions',
              {
                input: {
                  walletId: wallet.id,
                  type: ICryptoPositionInputType.All,
                },
              },
            ],
          });
        };
        // Sometimes balance does not update right away in 1 sec, do another update in 5 sec to increase redudancy
        invalidate(1000);
        invalidate(5000);
      } else if (chainId !== ChainId.Solana && chainId !== ChainId.Ton) {
        const invalidate = async () => {
          await delay(2000);
          await queryClient.invalidateQueries({
            queryKey: latestBalanceQueryKey(
              wallet.address,
              wallet.blockchain,
              {},
            ).slice(0, 3),
          });
        };
        invalidate();
      }
    });
    return unsubscribe;
  }, [wallet.address, wallet.blockchain]);
}

export function getPresetsForAsset(
  asset?: ICryptoBalance,
  presets?: SwapPresets,
) {
  const defaultPreset = defaultPresets(asset);
  const defaultPercentages = [25, 50, 100].map((value) => `${value}%`);
  if (presets && asset) {
    const savedPreset = presets[cryptoKey(asset)];
    return {
      absolute: savedPreset?.absolute ?? defaultPreset,
      percentage: (savedPreset?.percentage?.map((value) => `${value}%`) ??
        defaultPercentages) as Tuple<string, 3>,
    };
  } else {
    return {
      absolute: defaultPreset,
      percentage: defaultPercentages as Tuple<string, 3>,
    };
  }
}

export function serializeCustomLevelGasMap(levelMap: CustomGasLevelMap) {
  const settings: CustomGasSettings = {};
  Object.keys(levelMap).forEach((key) => {
    const chainId = parseInt(key);
    const level = levelMap[chainId];
    if (!level) {
      return;
    } else if (level.level && level.level.level === IGasLevel.Custom) {
      settings[chainId] = {
        custom: level.level.estimatedGasPrice.toString(),
      };
    } else if (level.level) {
      settings[chainId] = {
        index: gasLevelMap[level.level.level],
      };
    } else if (level.index !== undefined) {
      settings[chainId] = {
        index: level.index,
      };
    }
  });
  return settings;
}

export function deserializeCustomGasSettings(settings: CustomGasSettings) {
  const levelMap: CustomGasLevelMap = {};
  Object.keys(settings).forEach((key) => {
    const chainId = parseInt(key);
    const setting = settings[chainId];
    if (setting) {
      levelMap[chainId] = {
        index: setting.index,
        level: setting.custom
          ? customGasLevel(BigInt(setting.custom), chainId, 0n)
          : undefined,
      };
    }
  });
  return levelMap;
}

export function getInitialChainSecondaryAsset(
  chainId: number,
  crypto: ICryptoBalance[],
  assetMap: Record<number, string>,
  omit?: ICryptoBalance,
) {
  const defaultAsset = assetMap[chainId];
  const commonTokens = getCommonOwnedTokens(chainId, crypto);
  const valid = commonTokens.filter((token) => token.address !== omit?.address);
  return valid.find((token) => token.address === defaultAsset) ?? valid[0];
}

export function getLimitOrderInputError(input: ILimitOrderInput) {
  // TODO: add minimum order size
  // else if (parseFloat(input.targetPrice) * parseFloat(input.amount) < 5) {
  //   return 'Minimum order size is $5';
  // }
  if (!input.fromAsset) {
    return undefined;
  }
  const fromAssetBalance = parseFloat(
    ethers.formatUnits(
      input.fromAsset.balance,
      input.fromAsset.tokenMetadata.decimals,
    ),
  );
  if (input.amount === '.') {
    return 'Please enter a valid amount';
  } else if (parseFloat(input.amount) === 0 || input.amount === '') {
    return 'Enter a non-zero amount for your order';
  } else if (input.targetPrice === '.') {
    return 'Please enter a valid target price';
  } else if (parseFloat(input.targetPrice) === 0 || input.targetPrice === '') {
    return 'Enter a non-zero amount for your target price';
  } else if (parseFloat(input.amount) > fromAssetBalance) {
    return 'Insufficient funds';
  } else {
    return undefined;
  }
}

export function getLimitOrderPriceError(
  input: ILimitOrderInput,
  mode: QuickTradeMode,
) {
  return !isLimitInputValid(input) || !input.marketPrice
    ? undefined
    : mode === 'buy'
    ? parseFloat(input.targetPrice) > parseFloat(input.marketPrice)
      ? 'Buy price is higher than market price'
      : undefined
    : parseFloat(input.targetPrice) < parseFloat(input.marketPrice)
    ? 'Sell price is less than market price'
    : undefined;
}

export async function selectPrimaryAsset(
  asset: ICryptoBalance,
  mode: QuickTradeMode,
  spotForm: SpotForm,
  limitForm: LimitForm,
  ownedTokens: ICryptoBalance[],
  slippageMap: Record<number, number>,
) {
  if (mode === 'buy') {
    const fromAsset = spotForm.values.fromAsset;
    const toAsset = spotForm.values.toAsset;
    if (toAsset && cryptoKey(toAsset) === cryptoKey(asset)) {
      spotForm.setFieldValue('toAsset', asset);
      limitForm.setFieldValue('toAsset', asset);
      return;
    }
    // primary asset is the toAsset
    spotForm.setFieldValue('toAsset', asset);
    spotForm.setFieldValue('fromChainId', asset.chainId);
    spotForm.setFieldValue('toChainId', asset.chainId);
    spotForm.setFieldValue('amount', '');
    spotForm.setFieldValue(
      'slippage',
      getDefaultSlippage(asset.chainId, slippageMap),
    );
    limitForm.setFieldValue('toAsset', asset);
    limitForm.setFieldValue('chainId', asset.chainId);
    limitForm.setFieldValue('amount', '');
    if (
      asset.chainId !== fromAsset?.chainId ||
      !fromAsset ||
      (asset.address === fromAsset?.address &&
        asset.chainId === fromAsset.chainId)
    ) {
      const defaultAsset = getDefaultSecondaryAsset(asset, ownedTokens);
      spotForm.setFieldValue('fromAsset', defaultAsset);
      limitForm.setFieldValue('fromAsset', defaultAsset);
      if (defaultAsset) {
        const validAmount = '0';
        spotForm.setFieldValue('amount', validAmount);
        limitForm.setFieldValue('amount', validAmount);
      }
    }
  } else {
    const fromAsset = spotForm.values.fromAsset;
    const toAsset = spotForm.values.toAsset;
    if (fromAsset && cryptoKey(fromAsset) === cryptoKey(asset)) {
      spotForm.setFieldValue('fromAsset', asset);
      limitForm.setFieldValue('fromAsset', asset);
      return;
    }
    // primary asset is the fromAsset
    spotForm.setFieldValue('amount', '');
    spotForm.setFieldValue('fromAsset', asset);
    spotForm.setFieldValue('fromChainId', asset.chainId);
    spotForm.setFieldValue('toChainId', asset.chainId);
    limitForm.setFieldValue('fromAsset', asset);
    limitForm.setFieldValue('chainId', asset.chainId);
    limitForm.setFieldValue('amount', '');
    if (
      asset.chainId !== toAsset?.chainId ||
      !toAsset ||
      (asset.address === toAsset?.address && asset.chainId === toAsset.chainId)
    ) {
      const defaultAsset = getDefaultSecondaryAsset(asset, ownedTokens);
      spotForm.setFieldValue('toAsset', defaultAsset);
      limitForm.setFieldValue('toAsset', defaultAsset);
    }
  }
}

export function selectSecondaryAsset(
  asset: ICryptoBalance,
  mode: QuickTradeMode,
  spotForm: SpotForm,
  limitForm: LimitForm,
) {
  const primaryAsset =
    mode === 'buy' ? spotForm.values.toAsset : spotForm.values.fromAsset;
  const dup = cryptoKey(primaryAsset) === cryptoKey(asset);
  if (mode === 'buy' && !dup) {
    // secondary asset is the fromAsset
    spotForm.setFieldValue('amount', '');
    spotForm.setFieldValue('fromAsset', asset);
    spotForm.setFieldValue('fromChainId', asset.chainId);
    limitForm.setFieldValue('fromAsset', asset);
    limitForm.setFieldValue('chainId', asset.chainId);
    limitForm.setFieldValue('amount', '');
  } else if (!dup) {
    // secondary asset is the toAsset
    spotForm.setFieldValue('toAsset', asset);
    spotForm.setFieldValue('toChainId', asset.chainId);
    limitForm.setFieldValue('toAsset', asset);
    limitForm.setFieldValue('chainId', asset.chainId);
  }
}

export function useExternalAssetChange(
  externalAsset: ICryptoBalance | undefined,
  mode: QuickTradeMode,
  spotForm: SpotForm,
  limitForm: LimitForm,
  ownedTokens: ICryptoBalance[],
  slippageMap: SlippageMap,
) {
  const primaryAsset =
    mode === 'buy' ? spotForm.values.toAsset : spotForm.values.fromAsset;

  useEffect(() => {
    if (externalAsset) {
      selectPrimaryAsset(
        externalAsset,
        mode,
        spotForm,
        limitForm,
        ownedTokens,
        slippageMap,
      );
    }
  }, [externalAsset?.address, externalAsset?.chainId]);

  useEffect(() => {
    if (!externalAsset || !primaryAsset) {
      return;
    } else if (
      externalAsset.address === primaryAsset.address &&
      externalAsset.chainId === primaryAsset.chainId
    ) {
      selectPrimaryAsset(
        externalAsset,
        mode,
        spotForm,
        limitForm,
        ownedTokens,
        slippageMap,
      );
    }
  }, [externalAsset?.balance, primaryAsset?.address, primaryAsset?.chainId]);
}

export function useLocalForm(form: SpotForm | LimitForm, mode: QuickTradeMode) {
  const { fromAsset, toAsset, amount } = form.values;
  const { propogate } = usePropogateValue(form);

  const [touched, setTouched] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [localAmount, setLocalAmount] = useState(form.values.amount);

  const initialPrimaryRef = useRef(true);
  const initialSecondaryRef = useRef(true);

  const prevMode = usePrevious(mode);

  const primaryAsset =
    mode === 'buy' ? form.values.toAsset : form.values.fromAsset;
  const secondaryAsset =
    mode !== 'buy' ? form.values.toAsset : form.values.fromAsset;

  const modifyPercentage = (amount: string, asset: ICryptoBalance) => {
    const normalizedAmount = amount || '0';
    const total = parseFloat(getMaxBalanceMinusGas(asset, 'swap'));
    const percentage =
      total === 0
        ? 100
        : clamp(
            Math.round((parseFloat(normalizedAmount) / total) * 100),
            0,
            100,
          );
    setPercentage(percentage);
  };

  const propogatePercentage = (
    value: number,
    propogation: 'instant' | 'delay' | 'none',
  ) => {
    setPercentage(value);
    if (fromAsset) {
      const amountBig = getMaxBalanceMinusGas(fromAsset, 'swap');
      if (value === 100) {
        const amount = validDecimalAmount(
          amountBig,
          fromAsset.tokenMetadata.decimals,
        );
        setLocalAmount(amount);
        propogate(amount, propogation);
      } else {
        const amount = validDecimalAmount(
          `${parseFloat(amountBig) * (value / 100)}`,
          fromAsset.tokenMetadata.decimals,
        );
        setLocalAmount(amount);
        propogate(amount, propogation);
      }
      setTouched(true);
    }
  };

  const propogateAmount = (
    amount: string,
    type: 'instant' | 'delay' | 'none',
  ) => {
    if (fromAsset) {
      const validated = validDecimalAmount(
        amount,
        fromAsset.tokenMetadata.decimals,
      );
      setLocalAmount(validated);
      propogate(validated, type);
      modifyPercentage(validated, fromAsset);
      setTouched(true);
    }
  };

  useEffect(() => {
    if (mode === 'sell' && initialPrimaryRef.current && form.values.fromAsset) {
      setLocalAmount(form.values.amount);
      modifyPercentage(amount, form.values.fromAsset);
      initialPrimaryRef.current = true;
    } else if (mode === 'sell') {
      setLocalAmount('');
      setPercentage(0);
    }
  }, [cryptoKey(primaryAsset)]);

  useEffect(() => {
    if (
      mode === 'buy' &&
      initialSecondaryRef.current &&
      form.values.fromAsset
    ) {
      setLocalAmount(form.values.amount);
      modifyPercentage(amount, form.values.fromAsset);
      initialSecondaryRef.current = true;
    } else if (mode === 'buy') {
      setLocalAmount('');
      setPercentage(0);
    }
  }, [cryptoKey(secondaryAsset)]);

  useEffect(() => {
    if (!!prevMode && mode !== prevMode) {
      setLocalAmount('');
      setPercentage(0);
    }
  }, [mode, prevMode]);

  return {
    localAmount,
    percentage,
    touched,
    propogatePercentage,
    propogateAmount,
  };
}

export function usePropogateValue(form: SpotForm | LimitForm) {
  const debounceAmount = useDebounceCallback(
    useCallback((localAmount: string) => {
      form.setFieldValue('disabled', false);
      form.setFieldValue('amount', localAmount);
    }, []),
    400,
  );

  const propogate = (value: string, type: 'instant' | 'delay' | 'none') => {
    if (type === 'delay') {
      form.setFieldValue('disabled', true);
      debounceAmount(value);
    } else if (type === 'instant') {
      form.setFieldValue('disabled', false);
      form.setFieldValue('amount', value);
    }
  };

  return { propogate };
}

export function getDefaultSlippage(chainId: number, slippageMap: SlippageMap) {
  return slippageMap[chainId] ?? (chainId === ChainId.Solana ? 15 : 3);
}
