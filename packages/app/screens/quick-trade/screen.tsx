import cn from 'classnames';
import { ethers } from 'ethers';
import { isNil } from 'lodash';
import { memo, useCallback, useMemo, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import { useEffectOnSuccess } from '../../common/hooks/loading';
import { ISignerWallet, Loadable, TradeSettings } from '../../common/types';
import { cond, empty } from '../../common/utils/functions';
import {
  altCondLoadable,
  composeLoadables,
  makeLoadable,
  makeLoadableError,
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { ScrollView } from '../../components/scroll';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { colors } from '../../design/constants';
import { ChainId, onBlockchain } from '../../features/chain';
import { cryptoKey } from '../../features/crypto/utils';
import { useDimensions } from '../../features/dimensions';
import { parseError } from '../../features/errors';
import { usePlatformHeaderHeight } from '../../features/header';
import { GasPriceLevel } from '../../features/proposal/types';
import { useSafeAreaInsets } from '../../features/safe-area';
import { PresetInput, SwapPresets, SwapRoute } from '../../features/swap/types';
import {
  getSwapAssetError,
  isInputValid,
  isLimitInputValid,
} from '../../features/swap/utils';
import { isHardwareWallet } from '../../features/wallet/utils';
import {
  IBlockchainType,
  ICryptoBalance,
  IGasLevel,
  ITransaction,
  IUser,
  IWalletDeploymentStatus,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../molecules/error/screen';
import { feeDataToGasLevels, gasLevelMap } from '../../molecules/gas/utils';
import { useAudioContext } from '../../provider/audio';
import { useLanguageContext } from '../../provider/language';
import { MarketContextProvider } from '../../provider/market';
import { MarketStreamContextProvider } from '../../provider/market-stream';
import { PositionContextProvider } from '../../provider/position';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { LedgerSwapSigningSheet } from '../proposal/ledger';
import { SwapSettingsInput } from '../swap/settings/content';
import { SwapSettingsSheet } from '../swap/settings/sheet';
import { sufficientFundError, useSwapGasLevel } from '../swap/utils';
import { TokenDetailsLoadingScreen } from '../token-details/empty';
import { TokenDetailsWithQuery } from '../token-details/query';
import { ShareFunction } from '../token-details/types';
import { LimitPanel } from './limit-panel';
import { QuickTradeLoadingScreen } from './loading';
import { localization } from './localization';
import { ModeSection } from './mode';
import { NoisyTextButton } from './noisy-text-button';
import { SpotPanel } from './spot-panel';
import {
  CustomGasLevelMap,
  LimitForm,
  QuickTradeMode,
  SlippageMap,
  SpotForm,
  TradeAction,
} from './types';
import {
  deserializeCustomGasSettings,
  getLimitOrderInputError,
  getLimitOrderPriceError,
  selectPrimaryAsset,
  serializeCustomLevelGasMap,
  useExternalAssetChange,
} from './utils';

interface QuickTradeScreenProps {
  spotForm: SpotForm;
  limitForm: LimitForm;
  wallet: ISignerWallet;
  user: IUser;
  mode: QuickTradeMode;
  tradeSettings: TradeSettings;
  cryptoBalances: ICryptoBalance[];
  presets: Loadable<SwapPresets>;
  externalAsset: Loadable<ICryptoBalance | null>;
  route: Loadable<SwapRoute | null>;
  showLedgerSigningSheet: boolean;
  onModeChange: (mode: QuickTradeMode) => void;
  onPresetsChange: (input: PresetInput) => Promise<void>;
  onSpotExecute: (
    mev: boolean,
    onApprove?: VoidFunction,
    gas?: GasPriceLevel,
    tip?: bigint,
  ) => Promise<void>;
  onLimitExecute: (gas?: GasPriceLevel) => Promise<void>;
  onTradeSettingsChange: (settings: TradeSettings) => Promise<void>;
  onToggleLedgerSigningSheet: (open: boolean) => void;

  // Token details actions
  onShare: ShareFunction;
  onSendPress: (token: ICryptoBalance) => void;
  onTransactionPress: (transaction: ITransaction) => void;
  onBack: VoidFunction;
}

export function QuickTradeScreen(props: QuickTradeScreenProps) {
  const {
    spotForm,
    limitForm,
    wallet,
    user,
    presets,
    mode,
    tradeSettings,
    externalAsset,
    cryptoBalances,
    route,
    showLedgerSigningSheet,
    onModeChange,
    onPresetsChange,
    onSpotExecute,
    onLimitExecute,
    onTradeSettingsChange,
    onToggleLedgerSigningSheet,
    onBack,
    onShare,
    onSendPress,
    onTransactionPress,
  } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();
  const { buyModeSound, sellModeSound, deleteSound1 } =
    useAudioContext().sounds;
  const { top, bottom } = useSafeAreaInsets();
  const { headerHeight } = usePlatformHeaderHeight();
  const { height: initialHeight } = useDimensions();

  const [collapsed, setCollapsed] = useState(true);
  const [action, setAction] = useState<TradeAction>('spot');
  const [showSettings, setShowSettings] = useState(false);
  const [defaultSecondaryMap, setDefaultSecondaryMap] = useState<
    Record<number, string>
  >(tradeSettings.defaultSecondaryAsset);
  const [customGasMap, setCustomGasMap] = useState<CustomGasLevelMap>(
    deserializeCustomGasSettings(tradeSettings.customGas),
  );
  const [limitOrderGasMap, setLimitOrderGasMap] = useState<CustomGasLevelMap>(
    {},
  );
  const [slippageMap, setSlippageMap] = useState<SlippageMap>(
    tradeSettings.slippage,
  );
  const [tip, setTip] = useState<bigint | undefined>(
    tradeSettings.tip ? BigInt(tradeSettings.tip) : undefined,
  );
  const [mev, setMev] = useState(tradeSettings.mev);
  const [loading, setLoading] = useState(false);
  const [height, setHeight] = useState(initialHeight);
  const [open, setOpen] = useState(!collapsed);

  const modeChangeAnimationDuration = 200;
  const dataHeight = adjust(254, 42);
  const viewTranslationY = useSharedValue(0);
  const topMargin = useSharedValue(collapsed ? height : dataHeight);
  const viewOpacity = useSharedValue(1);
  const viewScale = useSharedValue(1);

  const staticButtonStyle = useMemo(
    () => ({
      position: Platform.OS !== 'web' ? ('absolute' as const) : undefined,
      bottom: Platform.OS !== 'web' ? 0 : undefined,
      width: '100%' as const,
    }),
    [],
  );

  const animatedViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: viewTranslationY.value },
        { scale: viewScale.value },
      ],
      opacity: viewOpacity.value,
    };
  });

  const tradeSectionStaticStyle = useMemo(
    () => ({
      backgroundColor: colors.card,
      borderColor: colors.cardHighlight,
      borderTopWidth: 1,
      borderRadius: 16,
    }),
    [],
  );

  const tradeSectionAnimatedStyle = useAnimatedStyle(() => {
    return {
      marginTop: topMargin.value,
      flex: 1,
    };
  });

  const handleAnimateModeSwitch = (newMode: QuickTradeMode) => {
    if (newMode === 'buy') buyModeSound?.replayAsync();
    else if (newMode === 'sell') sellModeSound?.replayAsync();

    viewScale.value = withTiming(
      0.95,
      { duration: modeChangeAnimationDuration },
      () =>
        (viewScale.value = withTiming(1, {
          easing: Easing.out(Easing.exp),
        })),
    );
    viewOpacity.value = withTiming(
      0.7,
      { duration: modeChangeAnimationDuration },
      () =>
        (viewOpacity.value = withTiming(1, {
          easing: Easing.out(Easing.exp),
        })),
    );
  };

  const handleAnimateActionScreen = async (action: TradeAction) => {
    viewTranslationY.value = withTiming(300, {
      duration: modeChangeAnimationDuration,
    });
    viewOpacity.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
    });
    await delay(modeChangeAnimationDuration);
    setAction(action);
    viewTranslationY.value = withTiming(0, {
      duration: modeChangeAnimationDuration,
      easing: Easing.out(Easing.exp),
    });
    viewOpacity.value = withTiming(1, {
      duration: modeChangeAnimationDuration,
    });
  };

  const primaryAsset =
    mode === 'buy' ? spotForm.values.toAsset : spotForm.values.fromAsset;
  const nativeAsset = cryptoBalances.find(
    (balance) =>
      balance.tokenMetadata.isNativeToken &&
      spotForm.values.fromChainId === balance.chainId,
  );

  const { parsedFeeData, gasLimit } = useSwapGasLevel(
    spotForm.values.fromChainId,
    spotForm.values.toChainId,
    action === 'limit' ? limitOrderGasMap : customGasMap,
    action === 'limit' ? 'limit' : 'market',
    nativeAsset,
  );

  const gasLevels = useMemo(
    () => mapLoadable(parsedFeeData)((data) => feeDataToGasLevels(data)),
    [...spreadLoadable(parsedFeeData)],
  );

  const spotInput = spotForm.values;
  const validSpotInput = isInputValid(spotInput);
  const spotFundError =
    customGasMap[spotInput.fromChainId]?.level &&
    spotInput.fromAsset &&
    validSpotInput &&
    gasLimit.data &&
    action === 'spot'
      ? sufficientFundError(
          spotInput.fromChainId,
          cryptoBalances,
          (spotInput.fromChainId === ChainId.Solana ? tip ?? 0n : 0n) +
            (spotInput.fromAsset.tokenMetadata.isNativeToken
              ? ethers.parseUnits(
                  spotInput.amount,
                  spotInput.fromAsset.tokenMetadata.decimals,
                )
              : 0n),
          customGasMap[spotInput.fromChainId]!.level!.estimatedGasPrice *
            gasLimit.data!,
        )
      : undefined;
  const spotError = getSwapAssetError(spotInput, route);
  const toAmount =
    spotInput.amount === ''
      ? makeLoadable('')
      : parseFloat(spotInput.amount) === 0 ||
        isNaN(parseFloat(spotInput.amount))
      ? makeLoadable('0')
      : spotError
      ? makeLoadableError()
      : mapLoadable(route)((route) => {
          const toAmount = route?.data.toAmount;
          return toAmount && spotInput.toAsset
            ? ethers.formatUnits(
                toAmount,
                spotInput.toAsset.tokenMetadata.decimals,
              )
            : '';
        });
  // TODO: add logic for TON nonce pending
  const limitInput = limitForm.values;
  const validLimitInput = isLimitInputValid(limitInput);
  const limitFundError =
    limitOrderGasMap[limitInput.chainId]?.level &&
    limitInput.fromAsset &&
    validLimitInput &&
    gasLimit.data &&
    action === 'limit'
      ? sufficientFundError(
          limitInput.chainId,
          cryptoBalances,
          7_000_000n +
            (limitInput.fromAsset.tokenMetadata.isNativeToken
              ? ethers.parseUnits(
                  limitInput.amount,
                  limitInput.fromAsset.tokenMetadata.decimals,
                )
              : 0n),
          limitOrderGasMap[limitInput.chainId]!.level!.estimatedGasPrice *
            gasLimit.data!,
        )
      : undefined;
  const limitPriceError = getLimitOrderPriceError(limitInput, mode);
  const limitError = getLimitOrderInputError(limitInput);
  const chainMatch = onBlockchain(wallet.blockchain)(
    () =>
      !!primaryAsset &&
      primaryAsset.chainId !== ChainId.Solana &&
      primaryAsset.chainId !== ChainId.Ton,
    () => primaryAsset?.chainId === ChainId.Solana,
    () => primaryAsset?.chainId === ChainId.Ton,
  );
  const mutable =
    (Platform.OS !== 'ios' || cryptoBalances.length > 0) &&
    chainMatch &&
    !(isHardwareWallet(wallet) && Platform.OS !== 'web') &&
    ((wallet.type === IWalletType.Safe &&
      wallet.deploymentStatus === IWalletDeploymentStatus.Deployed) ||
      !!wallet?.hasKeyring);

  useEffectOnSuccess(gasLevels, (data) => {
    if (action === 'limit') {
      const chainId = limitForm.values.chainId;
      const limitGas = limitOrderGasMap[chainId];
      const isCustom = !!limitGas && isNil(limitGas.index);
      const defaultIndex =
        gasLevelMap[
          chainId === ChainId.Ethereum ? IGasLevel.Standard : IGasLevel.Fast
        ];
      if (!isCustom) {
        const index = limitGas ? limitGas.index ?? defaultIndex : defaultIndex;
        setLimitOrderGasMap({
          ...limitOrderGasMap,
          [chainId]: {
            level: data[index],
            index,
          },
        });
      }
    } else {
      const chainId = spotForm.values.fromChainId;
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
    }
  });

  const handleExpand = async (expand: boolean) => {
    const duration = 300;
    topMargin.value = withTiming(expand ? 0 : dataHeight, {
      duration,
    });
    await delay(duration);
  };

  const handleOpen = async (asset: ICryptoBalance, buy: boolean) => {
    const duration = 300;
    const newMode = buy ? 'buy' : 'sell';
    // TODO: this cryptobalance capture might be stale
    selectPrimaryAsset(
      asset,
      newMode,
      spotForm,
      limitForm,
      cryptoBalances,
      slippageMap,
    );
    onModeChange(newMode);
    setCollapsed(false);
    setOpen(true);
    topMargin.value = withTiming(dataHeight, {
      duration,
      easing: Easing.out(Easing.exp),
    });
  };

  const handleChangeMode = useCallback(
    async (newMode: QuickTradeMode) => {
      if (mode === newMode) return;
      onModeChange(newMode);
      handleAnimateModeSwitch(newMode);
      // TODO: set percetange on change
      if (mode !== newMode) {
        spotForm.setFieldValue('amount', '');
        spotForm.setFieldValue('fromAsset', spotInput.toAsset);
        spotForm.setFieldValue('toAsset', spotInput.fromAsset);
        limitForm.setFieldValue('amount', '');
        limitForm.setFieldValue('fromAsset', limitInput.toAsset);
        limitForm.setFieldValue('toAsset', limitInput.fromAsset);
      }
    },
    [
      spotInput.toAsset,
      spotInput.fromAsset,
      limitInput.toAsset,
      limitInput.fromAsset,
      action,
      mode,
    ],
  );

  const handleChangeAction = useCallback(
    (newAction: TradeAction) => {
      if (action !== newAction) {
        spotForm.setFieldValue('amount', '');
        limitForm.setFieldValue('amount', '');
        handleAnimateActionScreen(newAction);
      }
    },
    [action],
  );

  const handleCloseLedgerSigningSheet = () => {
    onToggleLedgerSigningSheet(false);
  };

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
        ? spotForm.values.slippage.toString()
        : input.slippage;
    const newSlippageMap = {
      ...slippageMap,
      [input.chainId]: parseFloat(slippage),
    };
    spotForm.setFieldValue('slippage', slippage);
    limitForm.setFieldValue('slippage', slippage);
    setSlippageMap(newSlippageMap);

    // tip
    const rawTip = !input.tip ? undefined : ethers.parseUnits(input.tip, 9);
    const tip = rawTip === 0n ? undefined : rawTip;
    setTip(tip);

    // mev
    const mev = input.mev;
    setMev(mev);

    // gas
    const gas =
      action === 'limit'
        ? customGasMap
        : normalizeGasMap(input.chainId, input.gas);
    if (action === 'limit' && input.gas) {
      const index = gasLevelMap[input.gas.level];
      setLimitOrderGasMap({
        ...limitOrderGasMap,
        [limitForm.values.chainId]: {
          level: input.gas,
          index: input.gas.level === IGasLevel.Custom ? undefined : index,
        },
      });
    } else if (action === 'spot') {
      setCustomGasMap(gas);
    }

    // approval
    const infinite = input.infiniteApproval;
    spotForm.setFieldValue('infiniteApproval', infinite);
    limitForm.setFieldValue('infiniteApproval', infinite);

    // simulate
    const simulate = input.simulate;
    spotForm.setFieldValue('simulate', simulate);

    await onTradeSettingsChange({
      customGas: serializeCustomLevelGasMap(gas),
      defaultSecondaryAsset: defaultSecondaryMap,
      slippage: newSlippageMap,
      tip: tip?.toString() ?? null,
      mev,
      infiniteApproval: infinite,
      simulate,
    }).catch(empty);
  };

  const handleDefaultSecondaryAssetChange = (balance: ICryptoBalance) => {
    const newMap = {
      ...defaultSecondaryMap,
      [balance.chainId]: balance.address,
    };
    setDefaultSecondaryMap(newMap);
    onTradeSettingsChange({
      customGas: serializeCustomLevelGasMap(customGasMap),
      slippage: slippageMap,
      tip: tip?.toString() ?? null,
      defaultSecondaryAsset: newMap,
      mev,
      infiniteApproval: spotInput.infiniteApproval,
      simulate: spotInput.simulate,
    });
  };

  const handleSpotSubmit = useCallback(async () => {
    try {
      if (!route.data) {
        throw new Error('No route found');
      } else if (wallet.type === IWalletType.Ledger) {
        onToggleLedgerSigningSheet(true);
      } else {
        setLoading(true);
        await onSpotExecute(
          mev,
          undefined,
          customGasMap[route.data.data.fromChainId]?.level,
          tip,
        );
        if (Platform.OS !== 'web') {
          Keyboard.dismiss();
        }
      }
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message,
        sound: deleteSound1,
      });
    } finally {
      setLoading(false);
    }
  }, [customGasMap, tip, mev, action, ...spreadLoadable(route)]);

  const handleLimitSubmit = async () => {
    try {
      setLoading(true);
      await onLimitExecute(limitOrderGasMap[limitForm.values.chainId]?.level);
      if (Platform.OS !== 'web') {
        Keyboard.dismiss();
      }
    } catch (err) {
      const { message } = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message,
        sound: deleteSound1,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLedgerSubmit = async (onApprove: VoidFunction) => {
    if (route.data) {
      await onSpotExecute(
        mev,
        onApprove,
        customGasMap[route.data.data.fromChainId]?.level,
        tip,
      );
    }
  };

  const handleLower = (closed: boolean) => {
    if (closed) {
      setOpen(false);
    }
    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
  };

  useExternalAssetChange(
    externalAsset.data ?? undefined,
    mode,
    spotForm,
    limitForm,
    cryptoBalances,
    slippageMap,
  );

  const pan = Gesture.Pan()
    .onChange((event) => {
      topMargin.value = Math.min(
        Math.max(topMargin.value + event.changeY, 0),
        height - top - BUTTON_HEIGHT - 100,
      );
    })
    .onFinalize((event) => {
      const swipeDown = event.velocityY > 1000;
      const swipeUp = event.velocityY < -1000;
      const fullyDown = height + 60;
      if (swipeDown) {
        const snap = topMargin.value < dataHeight ? dataHeight : fullyDown;
        if (snap === fullyDown) {
          runOnJS(handleLower)(true);
        } else if (snap === dataHeight) {
          runOnJS(handleLower)(false);
        }
        topMargin.value = withTiming(snap, { duration: 200 });
      } else if (swipeUp) {
        const snap = topMargin.value < dataHeight ? 0 : dataHeight;
        topMargin.value = withTiming(snap, { duration: 200 });
      } else {
        const snap0 = dataHeight / 2;
        const snap1 = (height - top - bottom - 120 + dataHeight) / 2;
        const snap =
          topMargin.value < snap0
            ? 0
            : topMargin.value < snap1
            ? dataHeight
            : fullyDown;
        if (snap === fullyDown) {
          runOnJS(handleLower)(true);
        } else if (snap === dataHeight) {
          runOnJS(handleLower)(false);
        }
        topMargin.value = withTiming(snap, { duration: 200 });
      }
    });

  return onLoadable(presets)(
    () =>
      collapsed ? <TokenDetailsLoadingScreen /> : <QuickTradeLoadingScreen />,
    () => (
      <ErrorScreen
        title={
          collapsed
            ? localization.tokenDataErrorTitle[language]
            : localization.unableToStartTrade[language]
        }
        description={
          collapsed
            ? localization.tokenDataErrorDescription[language]
            : localization.errorGettingBalances[language]
        }
      />
    ),
    (presets) =>
      primaryAsset ? (
        <MarketStreamContextProvider asset={primaryAsset}>
          <MarketContextProvider asset={primaryAsset}>
            <PositionContextProvider asset={primaryAsset}>
              <ViewWithInset
                className={cn('flex h-full w-full flex-col justify-between', {
                  absolute: Platform.OS === 'web',
                })}
                hasBottomInset={false}
                keyboardOffset={Platform.OS === 'ios' ? -24 : 0}
                shouldAvoidKeyboard={Platform.OS !== 'web'}
                onLayout={
                  Platform.OS === 'web'
                    ? (e) => setHeight(e.nativeEvent.layout.height)
                    : undefined
                }
              >
                <TokenDetails
                  user={user}
                  wallet={wallet}
                  token={primaryAsset}
                  hideActions={!mutable}
                  offset={
                    collapsed || !open
                      ? 0
                      : Platform.OS === 'web'
                      ? height - dataHeight - 56
                      : height - (dataHeight + top + headerHeight) - 80
                  }
                  onPressSend={onSendPress}
                  onPressShare={onShare(primaryAsset)}
                  onPressSwap={handleOpen}
                  onPressTransaction={onTransactionPress}
                  onBack={onBack}
                />
                {!collapsed && (
                  <Animated.View
                    style={[tradeSectionStaticStyle, tradeSectionAnimatedStyle]}
                  >
                    <ScrollView
                      keyboardShouldPersistTaps={
                        Platform.OS === 'web' ? undefined : 'never'
                      }
                      showsVerticalScrollIndicator={false}
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingBottom: BUTTON_HEIGHT + 96,
                      }}
                    >
                      <GestureDetector gesture={pan}>
                        <View className='flex flex-col'>
                          <View className='h-6 w-full items-center'>
                            <View className='bg-card-highlight-secondary mt-1.5 h-1 w-12 rounded-full' />
                          </View>
                          <ModeSection
                            user={user}
                            action={action}
                            mode={mode}
                            showSettings={showSettings}
                            disabled={loading}
                            onModeChange={handleChangeMode}
                            onActionChange={handleChangeAction}
                          />
                        </View>
                      </GestureDetector>
                      <View className='h-full justify-between'>
                        <View className='flex flex-col'>
                          {action === 'spot' && (
                            <Animated.View style={animatedViewStyle}>
                              <View className='mt-2 flex flex-col px-4'>
                                <SpotPanel
                                  wallet={wallet}
                                  route={route}
                                  presets={presets}
                                  limitForm={limitForm}
                                  spotForm={spotForm}
                                  toAmount={toAmount}
                                  externalError={spotFundError}
                                  mode={mode}
                                  crypto={cryptoBalances}
                                  tip={tip}
                                  mev={mev}
                                  totalFee={altCondLoadable(
                                    composeLoadables(
                                      gasLimit,
                                      parsedFeeData,
                                    )((data) =>
                                      customGasMap[spotInput.fromChainId]?.level
                                        ?.estimatedGasPrice
                                        ? data *
                                          customGasMap[spotInput.fromChainId]!
                                            .level!.estimatedGasPrice
                                        : 0n,
                                    ),
                                  )(
                                    (value) => value === 0n,
                                    () => makeLoadableError(),
                                  )}
                                  onPresetsChange={onPresetsChange}
                                  onSecondaryAssetChange={
                                    handleDefaultSecondaryAssetChange
                                  }
                                  onExpand={() => {
                                    if (Platform.OS !== 'web') {
                                      handleExpand(true);
                                    }
                                  }}
                                  onSettingsPress={() => setShowSettings(true)}
                                />
                              </View>
                            </Animated.View>
                          )}
                          {action === 'limit' && (
                            <Animated.View style={animatedViewStyle}>
                              <View className='mt-2 flex flex-col px-4'>
                                <LimitPanel
                                  wallet={wallet}
                                  presets={presets}
                                  spotForm={spotForm}
                                  limitForm={limitForm}
                                  mode={mode}
                                  crypto={cryptoBalances}
                                  externalError={
                                    limitFundError || limitPriceError
                                  }
                                  onPresetsChange={onPresetsChange}
                                  onSecondaryAssetChange={
                                    handleDefaultSecondaryAssetChange
                                  }
                                  onExpand={() => {
                                    if (Platform.OS !== 'web') {
                                      handleExpand(true);
                                    }
                                  }}
                                  onSettingsPress={() => setShowSettings(true)}
                                />
                              </View>
                            </Animated.View>
                          )}
                        </View>
                      </View>
                    </ScrollView>
                    {action === 'spot' && (
                      <Animated.View
                        style={[staticButtonStyle, animatedViewStyle]}
                      >
                        <View
                          className='px-4'
                          style={{ paddingBottom: bottom }}
                        >
                          <NoisyTextButton
                            text={
                              mode === 'buy'
                                ? localization.buy[language]
                                : localization.sell[language]
                            }
                            loading={loading}
                            buttonColor={
                              mode === 'buy' ? colors.success : colors.failure
                            }
                            disabled={
                              loading ||
                              !!spotError ||
                              spotInput.disabled ||
                              !validSpotInput ||
                              !route.data ||
                              !!spotFundError
                            }
                            onPress={handleSpotSubmit}
                          />
                        </View>
                      </Animated.View>
                    )}
                    {action === 'limit' &&
                      wallet.blockchain === IBlockchainType.Svm && (
                        <Animated.View
                          style={[animatedViewStyle, staticButtonStyle]}
                        >
                          <View
                            className='px-4'
                            style={{ paddingBottom: bottom }}
                          >
                            <NoisyTextButton
                              text={
                                mode === 'buy'
                                  ? localization.buy[language]
                                  : localization.sell[language]
                              }
                              loading={loading}
                              buttonColor={
                                mode === 'buy' ? colors.success : colors.failure
                              }
                              disabled={
                                loading ||
                                !!limitError ||
                                limitInput.disabled ||
                                !validLimitInput ||
                                !!limitFundError ||
                                !!limitPriceError
                              }
                              onPress={handleLimitSubmit}
                            />
                          </View>
                        </Animated.View>
                      )}
                  </Animated.View>
                )}
                <SwapSettingsSheet
                  isShowing={showSettings}
                  hasTopInset={true}
                  type='trade'
                  chainId={primaryAsset.chainId}
                  toChainId={primaryAsset.chainId}
                  slippageProps={{
                    slippage: spotInput.slippage.toString(),
                    slippageDefaults: [1, 3, 10],
                  }}
                  simulateProps={{
                    simulate: spotInput.simulate,
                  }}
                  tipProps={{
                    tip: tip?.toString() ?? '',
                  }}
                  mevProps={{
                    mev,
                  }}
                  approvalProps={{
                    infiniteApproval: spotInput.infiniteApproval,
                  }}
                  gasProps={{
                    chainId: primaryAsset.chainId,
                    toChainId: primaryAsset.chainId,
                    customGasMap,
                    limit: action === 'limit',
                    nativeAsset,
                  }}
                  limitProps={cond(action === 'limit', () => ({
                    expiration: limitForm.values.expiration,
                    onDateChange: (date) => {
                      limitForm.setFieldValue('expiration', date?.toSeconds());
                    },
                  }))}
                  onSettingsChange={handleSwapSettingsChange}
                  onClose={() => setShowSettings(false)}
                />
                {route.data &&
                  validSpotInput &&
                  wallet.type === IWalletType.Ledger && (
                    <LedgerSwapSigningSheet
                      isShowing={showLedgerSigningSheet}
                      requiresApproval={
                        wallet.blockchain === IBlockchainType.Svm
                          ? false
                          : undefined
                      }
                      wallet={wallet}
                      route={route.data}
                      fromAsset={spotInput.fromAsset!}
                      toAsset={spotInput.toAsset!}
                      inputAmount={ethers
                        .parseUnits(
                          spotInput.amount,
                          spotInput.fromAsset!.tokenMetadata.decimals,
                        )
                        .toString()}
                      onExecute={handleLedgerSubmit}
                      onClose={handleCloseLedgerSigningSheet}
                      onCompleted={handleCloseLedgerSigningSheet}
                    />
                  )}
              </ViewWithInset>
            </PositionContextProvider>
          </MarketContextProvider>
        </MarketStreamContextProvider>
      ) : null,
  );
}

const TokenDetails = memo(
  TokenDetailsWithQuery,
  (prev, cur) =>
    prev.user.id === cur.user.id &&
    cryptoKey(prev.token) === cryptoKey(cur.token) &&
    prev.offset === cur.offset &&
    prev.wallet.id === cur.wallet.id,
);
