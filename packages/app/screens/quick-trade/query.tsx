import { ethers } from 'ethers';
import { useMemo, useState } from 'react';
import { ISignerWallet, Loadable, TradeSettings } from '../../common/types';
import { recordify, tuple } from '../../common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { ChainId, onBlockchain } from '../../features/chain';
import { isDust, useLatestBalancesQuery } from '../../features/crypto/balance';
import { cryptoKey } from '../../features/crypto/utils';
import { useSwapPresets } from '../../features/swap/presets';
import { useSwapCryptoBalance } from '../../features/swap/wallet-balance';
import { IProtectedWalletClient } from '../../features/wallet/service/interface';
import {
  ICryptoBalance,
  ITransaction,
  ITransactionProposal,
  IUser,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../molecules/error/screen';
import { useLanguageContext } from '../../provider/language';
import { TokenDetailsLoadingScreen } from '../token-details/empty';
import { ShareFunction } from '../token-details/types';
import { useLimit } from './limit';
import { localization } from './localization';
import { useTradeMutations } from './mutation';
import { QuickTradeScreen } from './screen';
import { useSpot } from './spot';
import {
  BasicTokenInfo,
  LimitSubmit,
  QuickTradeMode,
  SafeSpotSubmit,
  SpotSubmit,
} from './types';
import { defaultCryptoBalance } from './utils';

interface QuickTradeQueryProps {
  user: IUser;
  wallet: ISignerWallet;
  client: IProtectedWalletClient;
  tradeSettings: TradeSettings;
  initialAsset: ICryptoBalance;
  externalAsset: Loadable<BasicTokenInfo | null>;
  onSafeExecute: (wallet: IWallet, proposal: ITransactionProposal) => void;
  onTradeSettingsChange: (settings: TradeSettings) => Promise<void>;
  onBack: VoidFunction;

  // Token detail actions
  onShare: ShareFunction;
  onSendPress: (token: ICryptoBalance) => void;
  onTransactionPress: (transaction: ITransaction) => void;
}

export function QuickTradeWithQuery(props: QuickTradeQueryProps) {
  const { wallet, client, onSafeExecute, onBack } = props;
  const { language } = useLanguageContext();
  const { executeLimit, executeSafeSpot, executeSpot, additionalAssets } =
    useTradeMutations(wallet, client, onSafeExecute);

  const cryptoBalances = useSwapCryptoBalance(wallet);

  const latestBalancesQuery = useLatestBalancesQuery(
    wallet,
    Object.values(additionalAssets).map((asset) =>
      tuple(asset.address, asset.chainId),
    ),
    { enabled: cryptoBalances.success },
  );
  const latestBalances: Loadable<Record<string, string>> =
    loadDataFromQuery(latestBalancesQuery);

  const filteredCryptoBalances = useMemo(
    () =>
      mapLoadable(cryptoBalances)((data) => {
        const filtered = [...data];
        const record = recordify(filtered, (item) => item.address);
        Object.values(additionalAssets).forEach((asset) => {
          if (!record[asset.address]) {
            filtered.push({ ...asset, balance: '0', balanceInUSD: '0' });
          }
        });
        return filtered.sort(
          (c0, c1) => parseFloat(c1.balanceInUSD) - parseFloat(c0.balanceInUSD),
        );
      }),
    [...spreadLoadable(cryptoBalances), additionalAssets],
  );

  const augmentedBalances = useMemo(
    () =>
      composeLoadables(
        filteredCryptoBalances,
        latestBalances,
      )((crypto, balances) => {
        return crypto.map((item) => {
          const key = cryptoKey(item);
          const pendingAdjust = 0n;
          const balance = balances[key] ?? item.balance;
          const adjustedBalance = BigInt(balance) + pendingAdjust;
          const normalizedBalance = adjustedBalance < 0n ? 0n : adjustedBalance;
          const newBalanceUSD =
            parseFloat(
              ethers.formatUnits(
                normalizedBalance,
                item.tokenMetadata.decimals,
              ),
            ) * parseFloat(item.tokenMetadata.price);
          const newBalance = {
            ...item,
            balance: normalizedBalance.toString(),
            balanceInUSD: newBalanceUSD.toString(),
          };
          return isDust(newBalance)
            ? {
                ...item,
                balance: '0',
                balanceInUSD: '0',
              }
            : newBalance;
        });
      }),
    [
      ...spreadLoadable(filteredCryptoBalances),
      ...spreadLoadable(latestBalances),
    ],
  );

  return onLoadable(augmentedBalances)(
    () => <TokenDetailsLoadingScreen />,
    () => (
      <ErrorScreen
        title={localization.tokenDataErrorTitle[language]}
        description={localization.tokenDataErrorDescription[language]}
      />
    ),
    (augmented) => (
      <QuickTradeWithBalance
        {...props}
        augmentedBalances={augmented}
        additionalAssets={additionalAssets}
        onExecuteLimit={executeLimit}
        onExecuteSafeSpot={executeSafeSpot}
        onExecuteSpot={executeSpot}
        onBack={onBack}
      />
    ),
  );
}

type QuickTradeBalanceProps = Omit<QuickTradeQueryProps, 'onSafeExecute'> & {
  augmentedBalances: ICryptoBalance[];
  additionalAssets: Record<string, ICryptoBalance>;
  onExecuteSpot: SpotSubmit;
  onExecuteLimit: LimitSubmit;
  onExecuteSafeSpot: SafeSpotSubmit;
};

function QuickTradeWithBalance(props: QuickTradeBalanceProps) {
  const {
    user,
    wallet,
    tradeSettings,
    initialAsset,
    externalAsset,
    augmentedBalances,
    onTradeSettingsChange,
    onExecuteLimit,
    onExecuteSafeSpot,
    onExecuteSpot,
    onBack,
    onShare,
    onSendPress,
    onTransactionPress,
  } = props;

  const [mode, setMode] = useState<QuickTradeMode>('buy');
  const [showLedgerSigningSheet, setShowLedgerSigningSheet] = useState(false);

  const { presets, updatePresets } = useSwapPresets();

  const {
    formik: spotForm,
    route,
    submit: spotSubmit,
  } = useSpot({
    ...props,
    initialPrimaryAsset: initialAsset,
    onSubmit: onExecuteSpot,
    onSafeSubmit: onExecuteSafeSpot,
    mode,
    showLedgerSigningSheet,
  });

  const { formik: limitForm, submit: limitSubmit } = useLimit({
    ...props,
    initialPrimaryAsset: initialAsset,
    onSubmit: onExecuteLimit,
    mode,
  });

  const externalPrimaryAsset = useMemo(
    () =>
      mapLoadable(externalAsset)((asset) => {
        if (!asset) return null;
        const invalid = onBlockchain(wallet.blockchain)(
          () =>
            asset.chainId === ChainId.Solana || asset.chainId === ChainId.Ton,
          () => asset.chainId !== ChainId.Solana,
          () => asset.chainId !== ChainId.Ton,
        );
        if (invalid) return null;
        const existing = augmentedBalances.find(
          (balance) =>
            asset.chainId === balance.chainId &&
            asset.address === balance.address,
        );
        if (existing) {
          return existing;
        } else {
          return defaultCryptoBalance(asset);
        }
      }),
    [augmentedBalances, ...spreadLoadable(externalAsset), wallet.id],
  );

  return (
    <QuickTradeScreen
      spotForm={spotForm}
      limitForm={limitForm}
      presets={presets}
      route={route}
      user={user}
      wallet={wallet}
      mode={mode}
      tradeSettings={tradeSettings}
      cryptoBalances={augmentedBalances}
      externalAsset={externalPrimaryAsset}
      showLedgerSigningSheet={showLedgerSigningSheet}
      onModeChange={(mode) => setMode(mode)}
      onPresetsChange={updatePresets}
      onSpotExecute={spotSubmit}
      onLimitExecute={limitSubmit}
      onTradeSettingsChange={onTradeSettingsChange}
      onToggleLedgerSigningSheet={(open) => setShowLedgerSigningSheet(open)}
      onBack={onBack}
      onShare={onShare}
      onSendPress={onSendPress}
      onTransactionPress={onTransactionPress}
    />
  );
}
