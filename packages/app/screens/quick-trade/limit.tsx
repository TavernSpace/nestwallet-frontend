import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { DateTime } from 'luxon';
import { useEffect, useMemo } from 'react';
import { useFetchData } from '../../common/hooks/graphql';
import { TradeSettings } from '../../common/types';
import { ChainId, getChainInfo, onBlockchain } from '../../features/chain';
import { GasPriceLevel } from '../../features/proposal/types';
import { nativeSolAddress } from '../../features/svm/constants';
import { getTransferTransactionData } from '../../features/svm/transaction/encode';
import { isLimitInputValid } from '../../features/swap/utils';
import {
  AssociatedExternalWalletDocument,
  IAssociatedExternalWalletQuery,
  IAssociatedExternalWalletQueryVariables,
  ICryptoBalance,
  ILimitOrderType,
  ITransactionLimitOrderMetadata,
  ITransactionMetadataInput,
  ITransactionMetaType,
  IUser,
  IWallet,
} from '../../graphql/client/generated/graphql';
import {
  ILimitOrderInput,
  LimitSubmit,
  QuickTradeLimitTransactionMetadata,
  QuickTradeMode,
} from './types';
import {
  defaultCommonBalance,
  getDefaultSecondaryAsset,
  getInitialChainSecondaryAsset,
} from './utils';

export function useLimitOrderFormik(props: {
  wallet: IWallet;
  initialAsset?: ICryptoBalance;
  initialChainId?: number;
  initialToAsset?: ICryptoBalance;
  slippage?: number;
  fee: number;
  infiniteApproval: boolean;
  onSubmit: (values: ILimitOrderInput) => Promise<void>;
}) {
  const {
    wallet,
    initialAsset,
    initialChainId,
    initialToAsset,
    slippage = 3,
    fee,
    infiniteApproval,
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
  const formik = useFormik<ILimitOrderInput>({
    initialValues: {
      targetPrice: '',
      amount: '',
      slippage,
      chainId,
      fromAsset: initialAsset,
      toAsset: initialToAsset,
      fee,
      infiniteApproval,
      disabled: false,
      expiration: undefined,
    },
    validateOnChange: false,
    onSubmit,
  });
  return { formik };
}

export function useLimit(props: {
  user: IUser;
  wallet: IWallet;
  tradeSettings: TradeSettings;
  augmentedBalances: ICryptoBalance[];
  initialPrimaryAsset?: ICryptoBalance;
  mode: QuickTradeMode;
  onSubmit: LimitSubmit;
}) {
  const {
    user,
    wallet,
    tradeSettings,
    initialPrimaryAsset,
    augmentedBalances,
    mode,
    onSubmit,
  } = props;
  const getExternalWalletAddress = useExternalWalletAddress();

  const submit = async (customGas?: GasPriceLevel) => {
    const rawInput = { ...formik.values };
    if (!isLimitInputValid(rawInput)) {
      throw new Error('Error parsing order details, please try again');
    }
    const input = rawInput as Required<ILimitOrderInput>;
    const value = ethers
      .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
      .toString();
    const orderFee = 7_000_000n;
    const externalWalletAddress = await getExternalWalletAddress(wallet);
    const data = await getTransferTransactionData(
      wallet.address,
      [
        {
          asset: input.fromAsset,
          value: input.amount,
          recipient: externalWalletAddress.associatedExternalWallet,
          wrapSol: input.fromAsset.address === nativeSolAddress,
        },
        {
          asset: defaultCommonBalance(
            getChainInfo(input.chainId).nativeCurrency,
            input.chainId,
          ),
          value: ethers.formatUnits(orderFee, 9),
          recipient: externalWalletAddress.associatedExternalWallet,
          wrapSol: false,
        },
      ],
      customGas ? customGas.estimatedGasPrice : undefined,
    );
    const tradeMetadata: QuickTradeLimitTransactionMetadata = {
      type: 'limit',
      mode,
      fromToken: input.fromAsset,
      fromAmount: value,
      toToken: input.toAsset,
      targetPrice: input.targetPrice,
    };
    const limitOrderMetadata: ITransactionLimitOrderMetadata = {
      chainId: input.chainId,
      orderType: mode === 'buy' ? ILimitOrderType.Buy : ILimitOrderType.Sell,
      expiresAt: input.expiration
        ? DateTime.fromSeconds(input.expiration).toISO()
        : undefined,
      fromTokenAddress: input.fromAsset.address,
      fromTokenAmount: ethers
        .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
        .toString(),
      fromTokenMetadata: input.fromAsset.tokenMetadata,
      toTokenAddress: input.toAsset.address,
      toTokenMetadata: input.toAsset.tokenMetadata,
      targetPrice: parseFloat(input.targetPrice),
    };
    const metadata: ITransactionMetadataInput = {
      type: ITransactionMetaType.LimitOrder,
      data: limitOrderMetadata,
    };
    await onSubmit(
      input,
      {
        from: wallet.address,
        chainId: input.chainId,
        to: '',
        value: '',
        data,
      },
      tradeMetadata,
      metadata,
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

  const { formik } = useLimitOrderFormik({
    wallet,
    // TODO: make slippage customizable
    slippage: 5, //tradeSettings.defaultSlippage,
    onSubmit: async () => {},
    fee: onBlockchain(wallet.blockchain)(
      () => user.feeEvm,
      () => user.feeSvm,
      () => user.feeTvm,
    ),
    initialAsset,
    initialChainId: initialAsset?.chainId,
    initialToAsset,
    infiniteApproval: tradeSettings.infiniteApproval,
  });

  useEffect(() => {
    const fromAsset = augmentedBalances.find(
      (item) =>
        formik.values.chainId === item.chainId &&
        formik.values.fromAsset?.address === item.address &&
        formik.values.fromAsset.balance !== item.balance,
    );
    const toAsset = augmentedBalances.find(
      (item) =>
        formik.values.chainId === item.chainId &&
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
    submit,
  };
}

function useExternalWalletAddress() {
  const fetchData = useFetchData<
    IAssociatedExternalWalletQuery,
    IAssociatedExternalWalletQueryVariables
  >(AssociatedExternalWalletDocument);
  return (wallet: IWallet) => fetchData({ walletId: wallet.id });
}
