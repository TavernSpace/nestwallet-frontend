import { faGear } from '@fortawesome/pro-solid-svg-icons';
import { ethers } from 'ethers';
import { isNil } from 'lodash';
import { useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useEffectOnSuccess } from '../../common/hooks/loading';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { Loadable, TradeSettings } from '../../common/types';
import { empty } from '../../common/utils/functions';
import {
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { NeutralIconButton } from '../../components/button/icon-button';
import { TextButton } from '../../components/button/text-button';
import { ScrollView } from '../../components/scroll';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { ChainId } from '../../features/chain';
import { GasPriceLevel } from '../../features/proposal/types';
import { SwapRoute } from '../../features/swap/types';
import { getSwapAssetError, isInputValid } from '../../features/swap/utils';
import {
  IBlockchainType,
  IContact,
  ICryptoBalance,
  IGasLevel,
  IInteractedAddress,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { feeDataToGasLevels, gasLevelMap } from '../../molecules/gas/utils';
import { ExecutionSheet } from '../proposal/execution-sheet';
import { LedgerSwapSigningSheet } from '../proposal/ledger';
import { CustomGasLevelMap, SpotForm } from '../quick-trade/types';
import {
  deserializeCustomGasSettings,
  serializeCustomLevelGasMap,
} from '../quick-trade/utils';
import { SwapSettingsInput } from './settings/content';
import { SwapSettingsSheet } from './settings/sheet';
import { SwapForm } from './swap-form';
import { ExecutionDisplay } from './types';
import { sufficientFundError, useSwapGasLevel } from './utils';

interface SwapScreenProps {
  formik: SpotForm;
  wallet: IWallet;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
  tradeSettings: TradeSettings;
  interactions: Loadable<IInteractedAddress[]>;
  cryptoBalances: Loadable<ICryptoBalance[]>;
  route: Loadable<SwapRoute | null>;
  swappableTokens: Loadable<ICryptoBalance[]>;
  executionDisplay: ExecutionDisplay;
  onExecute: (
    mev: boolean,
    onApprove?: VoidFunction,
    gas?: GasPriceLevel,
    tip?: bigint,
  ) => Promise<string | undefined>;
  onTradeSettingsChange: (settings: TradeSettings) => Promise<void>;
  onDone: VoidFunction;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
  onToggleLock?: (enabled: boolean) => void;
  onExecutionDisplayChange: (display: ExecutionDisplay) => void;
}

export function SwapScreen(props: SwapScreenProps) {
  const {
    formik,
    wallets,
    wallet,
    contacts,
    tradeSettings,
    interactions,
    cryptoBalances,
    swappableTokens,
    executionDisplay,
    route,
    onExecute,
    onTradeSettingsChange,
    onAddContact,
    onToggleLock,
    onDone,
    onExecutionDisplayChange,
  } = props;

  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [customGasMap, setCustomGasMap] = useState<CustomGasLevelMap>(
    deserializeCustomGasSettings(tradeSettings.customGas),
  );
  const [mev, setMev] = useState(tradeSettings.mev);
  const [tip, setTip] = useState<bigint | undefined>(
    tradeSettings.tip ? BigInt(tradeSettings.tip) : undefined,
  );

  const input = formik.values;
  const validInput = isInputValid(input);
  const error = getSwapAssetError(input, route);

  const normalizeGasMap = (chainId: number, gas?: GasPriceLevel) => {
    if (!gas) return customGasMap;
    if (chainId === ChainId.Ton) return customGasMap;
    const current = customGasMap[chainId];
    const currentGas = current?.level?.estimatedGasPrice;
    const currentLevel = current?.level?.level;
    if (gas.estimatedGasPrice === currentGas && gas.level === currentLevel) {
      return customGasMap;
    }
    const index = gasLevelMap[gas.level];
    const newGas = {
      ...customGasMap,
      [chainId]: {
        level: gas,
        index: gas.level === IGasLevel.Custom ? undefined : index,
      },
    };
    return newGas;
  };

  const handleSwapSettingsChange = async (input: SwapSettingsInput) => {
    // slippage
    const slippage =
      input.slippage === ''
        ? formik.values.slippage.toString()
        : input.slippage;
    formik.setFieldValue('slippage', slippage);

    // tip
    const rawTip = !input.tip ? undefined : ethers.parseUnits(input.tip, 9);
    const tip = rawTip === 0n ? undefined : rawTip;
    setTip(tip);

    // mev
    const mev = input.mev;
    setMev(mev);

    // gas
    const gas = normalizeGasMap(input.chainId, input.gas);
    setCustomGasMap(gas);

    // approval
    const infinite = input.infiniteApproval;
    formik.setFieldValue('infiniteApproval', infinite);

    // simulate
    const simulate = input.simulate;
    formik.setFieldValue('simulate', simulate);

    await onTradeSettingsChange({
      customGas: serializeCustomLevelGasMap(gas),
      defaultSecondaryAsset: tradeSettings.defaultSecondaryAsset,
      slippage: tradeSettings.slippage,
      tip: tip?.toString() ?? null,
      mev,
      infiniteApproval: infinite,
      simulate,
    }).catch(empty);
  };

  const handleSubmit = async () => {
    if (!route.data) {
      return;
    } else if (wallet.type === IWalletType.Ledger) {
      onExecutionDisplayChange('ledger');
    } else if (wallet.type === IWalletType.Safe) {
      await onExecute(mev);
    } else {
      onExecutionDisplayChange('execute');
    }
  };

  const handleLedgerSubmit = async (onApprove: VoidFunction) => {
    if (!route.data) {
      return;
    } else {
      return onExecute(
        mev,
        onApprove,
        customGasMap[route.data.data.fromChainId]?.level,
        tip,
      );
    }
  };

  const handleEOASubmit = async () => {
    if (!route.data) {
      return;
    } else {
      return onExecute(
        mev,
        undefined,
        customGasMap[route.data.data.fromChainId]?.level,
        tip,
      );
    }
  };

  useNavigationOptions({
    headerRight: () => (
      <NeutralIconButton
        icon={faGear}
        onPress={() => setShowSettingsSheet(true)}
      />
    ),
  });

  const nativeAsset = cryptoBalances.data?.find(
    (balance) =>
      balance.tokenMetadata.isNativeToken &&
      formik.values.fromChainId === balance.chainId,
  );
  const { parsedFeeData, gasLimit } = useSwapGasLevel(
    formik.values.fromChainId,
    formik.values.toChainId,
    customGasMap,
    'market',
    nativeAsset,
  );

  const gasLevels = useMemo(
    () => mapLoadable(parsedFeeData)((data) => feeDataToGasLevels(data)),
    [...spreadLoadable(parsedFeeData)],
  );

  useEffectOnSuccess(gasLevels, (data) => {
    const chainId = formik.values.fromChainId;
    const spotGas = customGasMap[chainId];
    const isCustom = !!spotGas && isNil(spotGas.index);
    const defaultIndex =
      gasLevelMap[
        chainId === ChainId.Ethereum ? IGasLevel.Standard : IGasLevel.Fast
      ];
    if (!isCustom) {
      const index = spotGas ? spotGas.index ?? defaultIndex : defaultIndex;
      setCustomGasMap({
        ...customGasMap,
        [chainId]: {
          level: data[index],
          index,
        },
      });
    }
  });

  const fundError =
    customGasMap[input.fromChainId]?.level &&
    input.fromAsset &&
    validInput &&
    gasLimit.data
      ? sufficientFundError(
          input.fromChainId,
          cryptoBalances.data ?? [],
          (input.fromChainId === ChainId.Solana ? tip ?? 0n : 0n) +
            (input.fromAsset.tokenMetadata.isNativeToken
              ? ethers.parseUnits(
                  input.amount,
                  input.fromAsset.tokenMetadata.decimals,
                )
              : 0n),
          customGasMap[input.fromChainId]!.level!.estimatedGasPrice *
            gasLimit.data!,
        )
      : undefined;

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <View className='flex h-full w-full flex-grow flex-col justify-between px-4'>
          <ScrollView
            className='w-full flex-1'
            keyboardShouldPersistTaps={
              Platform.OS === 'web' ? undefined : 'handled'
            }
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <SwapForm
              formik={formik}
              contacts={contacts}
              interactions={interactions}
              wallet={wallet}
              wallets={wallets}
              cryptoBalances={cryptoBalances}
              swappableTokens={swappableTokens}
              route={route}
              externalError={fundError}
              onAddContact={onAddContact}
              onToggleLock={onToggleLock}
            />
          </ScrollView>
          <View className='space-y-2 pt-2'>
            <TextButton
              text={wallet.type === IWalletType.Safe ? 'Review' : 'Execute'}
              onPress={handleSubmit}
              disabled={
                !!error ||
                input.disabled ||
                !validInput ||
                !route.data ||
                !!fundError
              }
            />
          </View>
          {onLoadable(route)(
            () => null,
            () => null,
            (route) =>
              !route || !isInputValid(input) ? null : wallet.type !==
                IWalletType.Ledger ? (
                <ExecutionSheet
                  chainId={formik.values.fromChainId}
                  executor={wallet}
                  blockchain={wallet.blockchain}
                  isShowing={executionDisplay === 'execute'}
                  onClose={() => onExecutionDisplayChange('none')}
                  onCompleted={onDone}
                  onExecute={handleEOASubmit}
                />
              ) : (
                <LedgerSwapSigningSheet
                  isShowing={executionDisplay === 'ledger'}
                  isFullScreen={true}
                  route={route}
                  requiresApproval={
                    wallet.blockchain === IBlockchainType.Svm
                      ? false
                      : undefined
                  }
                  wallet={wallet}
                  fromAsset={input.fromAsset!}
                  toAsset={input.toAsset!}
                  inputAmount={ethers
                    .parseUnits(
                      input.amount,
                      input.fromAsset!.tokenMetadata.decimals,
                    )
                    .toString()}
                  onExecute={handleLedgerSubmit}
                  onClose={() => onExecutionDisplayChange('none')}
                  onCompleted={onDone}
                />
              ),
          )}
          <SwapSettingsSheet
            isShowing={showSettingsSheet}
            hasTopInset={false}
            type='bridge'
            chainId={input.fromChainId}
            toChainId={input.toChainId}
            slippageProps={{
              slippage: input.slippage.toString(),
              slippageDefaults: [1, 3, 10],
            }}
            simulateProps={{
              simulate: input.simulate,
            }}
            tipProps={{
              tip: tip?.toString() ?? '',
            }}
            mevProps={{
              mev,
            }}
            approvalProps={{
              infiniteApproval: input.infiniteApproval,
            }}
            gasProps={{
              chainId: input.fromChainId,
              toChainId: input.toChainId,
              limit: false,
              customGasMap,
              nativeAsset: cryptoBalances.data?.find(
                (balance) =>
                  balance.tokenMetadata.isNativeToken &&
                  input.fromChainId === balance.chainId,
              ),
            }}
            onSettingsChange={handleSwapSettingsChange}
            onClose={() => setShowSettingsSheet(false)}
          />
        </View>
      </ViewWithInset>
    </View>
  );
}
