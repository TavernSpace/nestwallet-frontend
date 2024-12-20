import { useIsFocused } from '@react-navigation/native';
import { ethers } from 'ethers';
import { zip } from 'lodash';
import { useMemo, useState } from 'react';
import {
  useMutationEmitter,
  useQueryRefetcher,
} from '../../common/hooks/query';
import { TradeSettings } from '../../common/types';
import { empty } from '../../common/utils/functions';
import {
  loadDataFromQuery,
  mapLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import {
  ChainId,
  getChainInfo,
  onBlockchain,
  swapSupportedChainsForBlockchain,
} from '../../features/chain';
import { useCreateAndExecuteEthKeyTransaction } from '../../features/evm/transaction/execute';
import { GasPriceLevel } from '../../features/proposal/types';
import { useCreateAndExecuteSvmTransaction } from '../../features/svm/transaction/execute';
import { useSwapRouteQuery } from '../../features/swap';
import { ISwapAssetInput } from '../../features/swap/types';
import {
  getCommonOwnedTokens,
  getSwapAssetInputError,
  isInputValid,
  useSwapInputFormik,
} from '../../features/swap/utils';
import { useSwapCryptoBalance } from '../../features/swap/wallet-balance';
import { IProtectedWalletClient } from '../../features/wallet/service/interface';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IInteractedAddress,
  IInteractionType,
  ISwapType,
  ITransactionMetaType,
  ITransactionProposal,
  IUser,
  IWallet,
  IWalletType,
  useContactsQuery,
  useInteractedAddressesQuery,
  useUpsertContactMutation,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';
import { sanitizeUpsertContactMutation } from '../../graphql/utils';
import { useNestWallet } from '../../provider/nestwallet';
import { SwapScreen } from './screen';
import { ExecutionDisplay } from './types';
import {
  computeEVMSwapTransactionOptions,
  getApprovalMetadataFromRoute,
  getBridgeMetadataFromRoute,
  getSwapMetadataFromRoute,
  getSwapTransactionFromRoute,
  useCreateSwapProposalMutation,
} from './utils';

interface ISwapQueryProps {
  user: IUser;
  wallet: IWallet;
  wallets: IWallet[];
  tradeSettings: TradeSettings;
  initialAsset?: ICryptoBalance;
  walletService: IProtectedWalletClient;
  onProposalCreated: (proposal: ITransactionProposal) => void;
  onSuccess: VoidFunction;
  onToggleLock?: (enabled: boolean) => void;
  onTradeSettingsChange: (settings: TradeSettings) => Promise<void>;
}

export function SwapWithQuery(props: ISwapQueryProps) {
  const {
    user,
    wallet,
    wallets,
    walletService,
    initialAsset,
    tradeSettings,
    onProposalCreated,
    onSuccess,
    onToggleLock,
    onTradeSettingsChange,
  } = props;
  const { apiClient } = useNestWallet();
  const isFocused = useIsFocused();

  const [executionDisplay, setExecutionDisplay] =
    useState<ExecutionDisplay>('none');

  const { mutate } = useCreateSwapProposalMutation(wallet);
  const { executeTransaction: executeEVMTransaction } =
    useCreateAndExecuteEthKeyTransaction(walletService, wallet);
  const {
    addFeesAndSendTransaction: executeSVMTransaction,
    signAndSendTransaction: executeSVMBridgeTransaction,
  } = useCreateAndExecuteSvmTransaction(walletService, wallet);

  const upsertContactMutation = useMutationEmitter(
    graphqlType.Contact,
    useUpsertContactMutation(),
  );

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: wallet.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) => data.contacts as IContact[],
  );

  const handleAddContact = async (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => {
    const input = sanitizeUpsertContactMutation({
      name,
      address,
      blockchain,
      organizationId: wallet.organization.id,
    });
    await upsertContactMutation.mutateAsync({ input });
    await contactsQuery.refetch().catch(empty);
  };

  const interactionsQuery = useQueryRefetcher(
    [graphqlType.Proposal, graphqlType.PendingTransaction],
    useInteractedAddressesQuery(
      {
        input: {
          interactionType: IInteractionType.Send,
        },
      },
      { staleTime: 1000 * 60 },
    ),
  );
  const interactions = loadDataFromQuery(
    interactionsQuery,
    (data) => data.interactedAddresses as IInteractedAddress[],
  );

  const cryptoBalances = useSwapCryptoBalance(wallet);

  const handleSubmit = async () => {
    if (!route.data) return;
    if (wallet.type === IWalletType.Safe) {
      const proposal = await mutate(input, route.data!, ISwapType.Swap);
      onProposalCreated(proposal);
    } else if (wallet.type === IWalletType.Ledger) {
      setExecutionDisplay('ledger');
    } else {
      setExecutionDisplay('execute');
    }
  };

  const { formik } = useSwapInputFormik({
    wallet,
    initialAsset,
    initialToAsset: initialAsset
      ? getCommonOwnedTokens(
          initialAsset.chainId,
          cryptoBalances.data ?? [],
          true,
        ).find((token) => token.address !== initialAsset.address)
      : undefined,
    slippage: 0.5,
    onSubmit: handleSubmit,
    fee: onBlockchain(wallet.blockchain)(
      () => user.feeEvm,
      () => user.feeSvm,
      () => user.feeTvm,
    ),
    infiniteApproval: tradeSettings.infiniteApproval,
    simulate: tradeSettings.simulate,
  });
  const input = formik.values;
  const inputError = getSwapAssetInputError(input);
  const commonCryptoBalances = useMemo(
    () =>
      mapLoadable(cryptoBalances)((balances) =>
        swapSupportedChainsForBlockchain[wallet.blockchain]
          .flatMap((chain) => getCommonOwnedTokens(chain.id, balances))
          .sort(
            (c0, c1) =>
              parseFloat(c1.balanceInUSD) - parseFloat(c0.balanceInUSD) ||
              getChainInfo(c1.chainId).swapPriority -
                getChainInfo(c0.chainId).swapPriority,
          ),
      ),
    [wallet, ...spreadLoadable(cryptoBalances)],
  );
  const swappableTokens = useMemo(
    () =>
      mapLoadable(cryptoBalances)((balances) =>
        getCommonOwnedTokens(
          input.toChainId,
          input.toAccount?.address === wallet.address ? balances : [],
        ),
      ),
    [
      input.toChainId,
      input.toAccount,
      wallet,
      ...spreadLoadable(cryptoBalances),
    ],
  );
  const { route } = useSwapRouteQuery(
    { ...input },
    wallet,
    !!inputError ||
      !input.fromAsset ||
      !isFocused ||
      executionDisplay !== 'none',
    'buy',
    true,
  );

  const handleEVMExecute = async (
    onApproved?: VoidFunction,
    customGas?: GasPriceLevel,
  ) => {
    const rawInput = { ...formik.values };
    if (!route.data || !isInputValid(rawInput)) return;
    const txs = await getSwapTransactionFromRoute(
      apiClient,
      route.data,
      wallet,
      input,
      customGas,
    );
    const options = await computeEVMSwapTransactionOptions(
      apiClient,
      wallet,
      cryptoBalances.data ?? [],
      route.data.data.fromChainId,
      txs,
      customGas,
    );
    const proposals: ITransactionProposal[] = [];
    for (const [transaction, option] of zip(txs, options)) {
      const isSwap = transaction!.type === 'swap';
      const isBridge = transaction!.type === 'bridge';
      const transactionInput = {
        walletId: wallet.id,
        chainId: transaction!.chainId,
        from: wallet.address,
        to: transaction!.data.to,
        data: transaction!.data.data,
        value: transaction!.data.value,
      };
      const metadata = isBridge
        ? getBridgeMetadataFromRoute(
            route.data,
            input,
            transaction!.bridgeMetadata!,
          )
        : isSwap
        ? getSwapMetadataFromRoute(route.data, input, ISwapType.Swap)
        : getApprovalMetadataFromRoute(route.data, input);
      const proposal = await executeEVMTransaction({
        transaction: transactionInput,
        transactionOptions: option!,
        isPrivate:
          (isSwap || isBridge) && transaction!.chainId === ChainId.Ethereum,
        metadata: [
          {
            type: isBridge
              ? ITransactionMetaType.Bridge
              : isSwap
              ? ITransactionMetaType.Swap
              : ITransactionMetaType.TokenApproval,
            data: metadata,
          },
        ],
      });
      if (!isSwap && !isBridge) {
        onApproved?.();
      }
      proposals.push(proposal);
    }
    return proposals[proposals.length - 1]!.ethKey!.txHash!;
  };

  const handleSVMExecute = async (
    mev: boolean,
    customGas?: GasPriceLevel,
    tip?: bigint,
  ) => {
    const rawInput = { ...formik.values };
    if (!isInputValid(rawInput) || !route.data) return;
    const input = rawInput as Required<ISwapAssetInput>;
    const transactions = await getSwapTransactionFromRoute(
      apiClient,
      route.data,
      wallet,
      input,
      customGas,
    );
    if (transactions.length !== 1) {
      throw new Error(
        'Invalid Solana swap transaction, incorrect transaction count',
      );
    }
    const transaction = transactions[0]!;
    const estimateCU =
      route.data.pumpfun ||
      route.data.moonshot ||
      route.data.lifiQuote ||
      route.data.lifiRoute
        ? false
        : input.fee > 0;
    const base58Data = transaction.data.data;
    if (route.data.lifiQuote || route.data.lifiRoute) {
      const bridgeMetadata = getBridgeMetadataFromRoute(
        route.data,
        input,
        transaction.bridgeMetadata!,
      );
      const proposal = await executeSVMBridgeTransaction({
        data: base58Data,
        metadata: [{ type: ITransactionMetaType.Bridge, data: bridgeMetadata }],
      });
      return proposal.svmKey!.txHash!;
    } else {
      const swapMetadata = getSwapMetadataFromRoute(
        route.data,
        input,
        ISwapType.Swap,
      );
      const proposal = await executeSVMTransaction({
        data: base58Data,
        amount: ethers
          .parseUnits(input.amount, input.fromAsset.tokenMetadata.decimals)
          .toString(),
        feeAsset: input.fromAsset,
        fee: input.fee / 10_000,
        estimateCU,
        computePrice: route.data.jupiter
          ? customGas?.estimatedGasPrice ?? true
          : undefined,
        tip,
        mev,
        simulate: input.simulate,
        metadata: [{ type: ITransactionMetaType.Swap, data: swapMetadata }],
      });
      return proposal.svmKey!.txHash!;
    }
  };

  const handleExecute = (
    mev: boolean,
    onApproved?: VoidFunction,
    customGas?: GasPriceLevel,
    tip?: bigint,
  ) => {
    return input.fromChainId === ChainId.Solana
      ? handleSVMExecute(mev, customGas, tip)
      : handleEVMExecute(onApproved, customGas);
  };

  return (
    <SwapScreen
      formik={formik}
      wallet={wallet}
      wallets={wallets}
      contacts={contacts}
      interactions={interactions}
      tradeSettings={tradeSettings}
      cryptoBalances={commonCryptoBalances}
      route={route}
      swappableTokens={swappableTokens}
      executionDisplay={executionDisplay}
      onExecute={handleExecute}
      onTradeSettingsChange={onTradeSettingsChange}
      onDone={onSuccess}
      onAddContact={handleAddContact}
      onToggleLock={onToggleLock}
      onExecutionDisplayChange={(display) => setExecutionDisplay(display)}
    />
  );
}
