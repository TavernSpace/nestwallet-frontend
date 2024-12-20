import { useIsFocused } from '@react-navigation/native';
import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { toNano } from '@ton/core';
import { ethers } from 'ethers';
import { useEffect, useMemo } from 'react';
import { Loadable, TradeSettings } from '../../common/types';
import { ChainId, onBlockchain } from '../../features/chain';
import { GasPriceLevel } from '../../features/proposal/types';
import { useSwapRouteQuery } from '../../features/swap';
import { ISwapAssetInput, SwapRoute } from '../../features/swap/types';
import {
  getSwapAssetInputError,
  isInputValid,
  useSwapInputFormik,
} from '../../features/swap/utils';
import { nativeTonAddress } from '../../features/tvm/constants';
import {
  ICryptoBalance,
  ISwapType,
  ITransactionMetadataInput,
  ITransactionMetaType,
  IUser,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { useNestWallet } from '../../provider/nestwallet';
import {
  computeEVMSwapTransactionOptions,
  getApprovalMetadataFromRoute,
  getSwapMetadataFromRoute,
  getSwapTransactionFromRoute,
} from '../swap/utils';
import { localization } from './localization';
import {
  QuickTradeMode,
  QuickTradeTransactionMetadata,
  SpotForm,
  SpotSubmit,
} from './types';
import {
  getDefaultSecondaryAsset,
  getDefaultSlippage,
  getInitialChainSecondaryAsset,
} from './utils';

export function useSpot(props: {
  user: IUser;
  wallet: IWallet;
  tradeSettings: TradeSettings;
  augmentedBalances: ICryptoBalance[];
  initialPrimaryAsset?: ICryptoBalance;
  mode: QuickTradeMode;
  showLedgerSigningSheet: boolean;
  onSubmit: SpotSubmit;
  onSafeSubmit: (
    formik: SpotForm,
    route: Loadable<SwapRoute | null>,
    swapType: ISwapType,
  ) => Promise<void>;
}) {
  const {
    user,
    wallet,
    tradeSettings,
    augmentedBalances,
    initialPrimaryAsset,
    mode,
    showLedgerSigningSheet,
    onSubmit,
    onSafeSubmit,
  } = props;
  const { apiClient } = useNestWallet();
  const { language } = useLanguageContext();
  const focused = useIsFocused();

  // TODO: check if pending tx has approval needed, then no need to send approval again
  const handleSubmit = async (
    mev: boolean,
    onApprove?: VoidFunction,
    customGas?: GasPriceLevel,
    tip?: bigint,
  ) => {
    const rawInput = { ...formik.values };
    if (!route.data || !isInputValid(rawInput)) {
      throw new Error('Error parsing trade details, please try again');
    } else if (wallet.type === IWalletType.Safe) {
      return onSafeSubmit(
        formik,
        route,
        mode === 'buy' ? ISwapType.Buy : ISwapType.Sell,
      );
    }
    const input = rawInput as Required<ISwapAssetInput>;
    const routeData = route.data;
    const chainId = route.data.data.fromChainId;
    const fromAmount = ethers
      .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
      .toString();
    const txs = await getSwapTransactionFromRoute(
      apiClient,
      route.data,
      wallet,
      input,
      customGas,
    );
    if (txs.length === 0) {
      throw new Error(
        'Unable to get transactions from route, please try again',
      );
    }
    const transactions = txs.map((tx) => ({
      from: wallet.address,
      chainId,
      to: tx.data.to,
      value: tx.data.value.toString() || '0x0',
      data: tx.data.data,
    }));
    const tradeMetadata = txs.map((tx): QuickTradeTransactionMetadata => {
      return tx.type === 'approve'
        ? {
            type: 'approval',
            isApproval: true,
            token: input.fromAsset,
          }
        : {
            type: 'spot',
            mode,
            fromToken: input.fromAsset,
            fromAmount,
            toToken: input.toAsset,
            toAmount: routeData.data.toAmount,
          };
    });
    const metadata: ITransactionMetadataInput[] = txs.map((tx) => {
      return tx.type === 'approve'
        ? {
            type: ITransactionMetaType.TokenApproval,
            data: getApprovalMetadataFromRoute(route.data!, input),
          }
        : {
            type: ITransactionMetaType.Swap,
            data: getSwapMetadataFromRoute(
              route.data!,
              input,
              mode === 'buy' ? ISwapType.Buy : ISwapType.Sell,
            ),
          };
    });
    if (chainId === ChainId.Solana) {
      const options = Array.from(
        { length: transactions.length },
        () => ({} as TransactionOptions),
      );
      const feeAsset = mode === 'buy' ? input.fromAsset : input.toAsset;
      const feeAmount =
        mode === 'buy' ? fromAmount : route.data.data.toAmountMin;
      const estimateCU =
        route.data.pumpfun || route.data.moonshot ? false : input.fee > 0;
      return onSubmit(
        transactions,
        options,
        tradeMetadata,
        feeAmount,
        feeAsset,
        input.fee,
        metadata,
        mev,
        input.simulate,
        estimateCU,
        route.data.jupiter ? customGas?.estimatedGasPrice ?? true : undefined,
        undefined,
        tip,
      );
    } else if (chainId === ChainId.Ton) {
      const options = Array.from(
        { length: transactions.length },
        () => ({} as TransactionOptions),
      );
      const feeAsset = mode === 'buy' ? input.fromAsset : input.toAsset;
      const feeAmount =
        mode === 'buy'
          ? route.data.data.fromAmount
          : route.data.data.toAmountMin;
      const tonBalance = augmentedBalances.find(
        (balance) => balance.address === nativeTonAddress,
      );
      const sufficientTon = !tonBalance
        ? false
        : BigInt(tonBalance.balance) >= toNano(0.3);
      if (!sufficientTon) {
        throw new Error(localization.insufficientTON[language]);
      }
      return onSubmit(
        transactions,
        options,
        tradeMetadata,
        feeAmount,
        feeAsset,
        input.fee,
        metadata,
        false,
        input.simulate,
      );
    }
    const options = await computeEVMSwapTransactionOptions(
      apiClient,
      wallet,
      augmentedBalances,
      chainId,
      txs,
      customGas,
    );
    return onSubmit(
      transactions,
      options,
      tradeMetadata,
      input.amount,
      input.fromAsset,
      input.fee,
      metadata,
      mev,
      input.simulate,
      undefined,
      undefined,
      onApprove,
    );
  };

  const defaultSecondaryAsset = useMemo(
    () =>
      initialPrimaryAsset
        ? getDefaultSecondaryAsset(initialPrimaryAsset, augmentedBalances)
        : getInitialChainSecondaryAsset(
            onBlockchain(wallet.blockchain)(
              () => wallet.chainId || ChainId.Ethereum,
              () => ChainId.Solana,
              () => ChainId.Ton,
            ),
            augmentedBalances,
            tradeSettings.defaultSecondaryAsset,
          ),
    [],
  );
  const initialAsset =
    mode === 'buy' ? defaultSecondaryAsset : initialPrimaryAsset;
  const initialToAsset =
    mode === 'sell' ? defaultSecondaryAsset : initialPrimaryAsset;

  const { formik } = useSwapInputFormik({
    wallet,
    slippage: getDefaultSlippage(
      initialAsset?.chainId ??
        onBlockchain(wallet.blockchain)(
          () => wallet.chainId || ChainId.Ethereum,
          () => ChainId.Solana,
          () => ChainId.Ton,
        ),
      tradeSettings.slippage,
    ),
    onSubmit: () => handleSubmit(false),
    fee: onBlockchain(wallet.blockchain)(
      () => user.feeEvm,
      () => user.feeSvm,
      () => user.feeTvm,
    ),
    initialAsset,
    initialChainId: initialAsset?.chainId,
    initialToAsset,
    infiniteApproval: tradeSettings.infiniteApproval,
    simulate: tradeSettings.simulate,
  });
  const input = formik.values;
  const inputError = getSwapAssetInputError(input);
  const { route } = useSwapRouteQuery(
    { ...input },
    wallet,
    !!inputError || !input.fromAsset || showLedgerSigningSheet || !focused,
    mode,
  );

  useEffect(() => {
    const fromAsset = augmentedBalances.find(
      (item) =>
        formik.values.fromChainId === item.chainId &&
        formik.values.fromAsset?.address === item.address &&
        formik.values.fromAsset.balance !== item.balance,
    );
    const toAsset = augmentedBalances.find(
      (item) =>
        formik.values.toChainId === item.chainId &&
        formik.values.toAsset?.address === item.address &&
        formik.values.toAsset.balance !== item.balance,
    );
    if (fromAsset) {
      formik.setFieldValue('fromAsset', fromAsset);
    }
    if (toAsset) {
      formik.setFieldValue('toAsset', toAsset);
    }
  }, [augmentedBalances]);

  return {
    formik,
    route,
    submit: handleSubmit,
  };
}
