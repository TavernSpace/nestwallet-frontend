import {
  faArrowUpRightFromSquare,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowUpRightAndArrowDownLeftFromCenter,
  faBadgeCheck,
  faBan,
  faBridgeWater,
  faCode,
  faFire,
  faHourglassStart,
  faMinimize,
  faMinus,
  faPaperPlane,
  faQuestionCircle,
  faScaleBalanced,
  faShuffle,
  faStore,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { partition } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '../../common/api/utils';
import { formatCrypto } from '../../common/format/number';
import { useLinkToBlockchainExplorer } from '../../common/hooks/link';
import { ExternalTransactionProposal } from '../../common/types';
import {
  firstOf,
  opacity,
  opaque,
  tuple,
  withHttps,
} from '../../common/utils/functions';
import { parseOrigin } from '../../common/utils/origin';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { Blur } from '../../components/blur';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { useKeyboard } from '../../components/sheet/keyboard';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import { useDimensions } from '../../features/dimensions';
import {
  resolveExternalTransactionProposal,
  tagExternalTransactionProposal,
} from '../../features/proposal/utils';
import { useSafeAreaInsets } from '../../features/safe-area';
import {
  ILimitOrderType,
  ISvmKeyTransactionProposal,
  ISwapType,
  ITransactionMetaType,
  ITransactionProposal,
  ITransactionProposalType,
  ITransactionStatus,
} from '../../graphql/client/generated/graphql';
import { useVerifyExecutionContext } from '../../provider/verify-execution';
import {
  ActionItem,
  CryptoHistoryAvatar,
  HistoryAvatar,
  NftHistoryAvatar,
  OriginImage,
  SwapHistoryAvatar,
} from './list';

export interface ExpandType {
  status?: ITransactionStatus;
}

const collapsedSize = adjust(40, 8);
const outer = -240;

function computeHeight(
  transactions: ITransactionProposal[],
  collapsed: boolean,
) {
  const size = 64;
  const paddedSize = 108;
  const [padded, normal] = partition(
    transactions.slice(0, 6),
    (tx) =>
      tx.type === ITransactionProposalType.SvmKey &&
      tx.svmKey!.status === ITransactionStatus.Failed &&
      !!tx.svmKey!.errorMessage,
  );
  return collapsed
    ? 48
    : Math.max(
        normal.length * size + padded.length * paddedSize + adjust(44),
        48,
      );
}

export function PendingTransactionBanner(props: {
  collapsed: boolean;
  bottomPadding: number;
  // Note: this is an object so we can force force the useEffect to update by making a new object
  expandType: ExpandType;
  onCollapse: (collapsed: boolean) => void;
  onExpand: (status: ITransactionStatus | undefined) => void;
  onComplete: (chainId: number) => void;
}) {
  const {
    collapsed,
    bottomPadding,
    expandType,
    onCollapse,
    onExpand,
    onComplete,
  } = props;
  const {
    stopVerifyingTransactionProposals,
    trackedTransactionProposals,
    subscribe,
  } = useVerifyExecutionContext();
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const { width, height } = useDimensions();
  const { height: keyboardHeight } = useKeyboard();

  const getTrackedTransactionProposals = (pendingOnly: boolean) => {
    return trackedTransactionProposals().filter((tx) => {
      const proposal = resolveExternalTransactionProposal(tx);
      return pendingOnly
        ? proposal.status === ITransactionStatus.Pending
        : proposal.status !== ITransactionStatus.Unsigned &&
            proposal.status !== ITransactionStatus.Replaced;
    });
  };

  const initialTransactions = useMemo(
    () => getTrackedTransactionProposals(false),
    [],
  );

  const [transactions, setTransactions] = useState(initialTransactions);
  const [expanded, setExpanded] = useState(false);
  const [isBeingDragged, setBeingDragged] = useState(false);

  const opacity = useSharedValue(1);
  const bannerWidth = useSharedValue(collapsed ? collapsedSize : width - 32);
  const bannerHeight = useSharedValue(
    computeHeight(initialTransactions, collapsed),
  );
  const right = useSharedValue(16);
  const bottom = useSharedValue(bottomInset + adjust(56, 10));
  const translateX = useSharedValue(outer);

  const notificationOpacity = useSharedValue(0);
  const notificationWidth = useSharedValue(0);

  const expandTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const bannerStaticStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      borderRadius: Platform.OS === 'web' ? undefined : 16,
    }),
    [],
  );

  const bannerAnimatedStyle = useAnimatedStyle(() => {
    return {
      bottom:
        Platform.OS === 'ios'
          ? Math.max(bottom.value, keyboardHeight.value + 16)
          : bottom.value,
      opacity: opacity.value,
      right: right.value,
      width: bannerWidth.value,
      height: bannerHeight.value,
      overflow: 'hidden',
    };
  });

  const notificationStaticStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      borderRadius: Platform.OS === 'web' ? 12 : 16,
      height: collapsedSize,
      width:
        transactions.length === 0 || !collapsed
          ? width - 32
          : width - 40 - collapsedSize,
    }),
    [collapsed, transactions.length === 0, width],
  );

  const notificationAnimatedStyle = useAnimatedStyle(() => {
    const offset =
      transactions.length !== 0 && collapsed ? collapsedSize + 8 : 0;
    const bottomOffset = Platform.OS === 'web' ? 8 : 0;
    const bottomOpenOffset = Platform.OS === 'web' ? 44 : 56;
    const bottomCollapsed =
      Platform.OS !== 'ios'
        ? bottom.value + bottomOffset
        : Math.max(
            bottom.value + bottomOffset,
            keyboardHeight.value + bottomOffset + 16,
          );
    const bottomOpen =
      Platform.OS !== 'ios'
        ? bottom.value - bottomOpenOffset
        : Math.max(
            bottom.value - bottomOpenOffset,
            keyboardHeight.value + 16 - bottomOpenOffset,
          );
    return {
      bottom: collapsed ? bottomCollapsed : bottomOpen,
      opacity: notificationOpacity.value,
      right: right.value + offset,
      overflow: 'hidden',
      transform: [{ translateX: translateX.value }],
    };
  }, [transactions.length !== 0, collapsed]);

  const handleDismiss = async (transaction: ExternalTransactionProposal) => {
    const tagged = tagExternalTransactionProposal(
      transaction,
      transaction.chainId === ChainId.Solana
        ? ITransactionProposalType.SvmKey
        : transaction.chainId === ChainId.Ton
        ? ITransactionProposalType.TvmKey
        : ITransactionProposalType.EthKey,
    );
    stopVerifyingTransactionProposals(tagged);
    const filtered = getTrackedTransactionProposals(false);
    if (filtered.length === 0) {
      opacity.value = withTiming(0, {
        duration: 200,
      });
      await delay(200);
      bannerWidth.value = collapsedSize;
      onCollapse(true);
    }
    setTransactions(filtered);
  };

  const handleCollapse = async () => {
    if (Platform.OS === 'web' && isBeingDragged) return;
    const totalHeight = computeHeight(transactions, !collapsed);
    bannerWidth.value = withTiming(collapsed ? width - 32 : collapsedSize, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
    bannerHeight.value = withTiming(totalHeight, {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
    if (!collapsed) {
      handleUnexpand();
      await delay(200);
    } else {
      right.value = withTiming(16, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      });
      bottom.value = withTiming(
        Math.min(height - topInset - totalHeight, bottom.value),
        {
          duration: 400,
          easing: Easing.out(Easing.exp),
        },
      );
    }
    onCollapse(!collapsed);
  };

  const handleUnexpand = async () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = undefined;
    }
    notificationOpacity.value = withTiming(0, {
      duration: 400,
    });
    translateX.value = withTiming(outer, {
      duration: 400,
      easing: Easing.inOut(Easing.exp),
    });
    await delay(400);
    setExpanded(false);
    onExpand(undefined);
  };

  const handleExpand = async (status: ITransactionStatus | undefined) => {
    const empty = transactions.length === 0;
    if (!collapsed && !empty) {
      // if the panel is open no need to do anything
      return;
    } else if (status) {
      if (!expandTimerRef.current) {
        expandTimerRef.current = setTimeout(handleUnexpand, 4000);
      } else {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = setTimeout(handleUnexpand, 4000);
      }
      setExpanded(true);
      await delay(0);
      notificationWidth.value = withTiming(
        empty || !collapsed ? width - 32 : width - 40 - collapsedSize,
        {
          duration: 400,
          easing: Easing.out(Easing.exp),
        },
      );
      notificationOpacity.value = withTiming(1, {
        duration: 400,
      });
      right.value = withTiming(16, {
        duration: 400,
        easing: Easing.out(Easing.exp),
      });
      translateX.value = withTiming(0, {
        duration: 400,
        easing: Easing.inOut(Easing.exp),
      });
    } else {
      handleUnexpand();
    }
  };

  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      const validTransactions = getTrackedTransactionProposals(false);
      opacity.value = withTiming(validTransactions.length === 0 ? 0 : 1, {
        duration: 200,
      });
      delay(200).then(() => {
        if (event.type === 'success') {
          onComplete(event.chainId);
          onExpand(ITransactionStatus.Confirmed);
        } else if (event.type === 'drop') {
          onExpand(ITransactionStatus.Dropped);
        } else if (event.type === 'fail') {
          onExpand(ITransactionStatus.Failed);
        }
        setTransactions(validTransactions);
      });
    });
    setTransactions(getTrackedTransactionProposals(false));
    return unsubscribe;
  }, []);

  useEffect(() => {
    const totalHeight = computeHeight(transactions, collapsed);
    bannerHeight.value = withTiming(computeHeight(transactions, collapsed), {
      duration: 400,
      easing: Easing.out(Easing.exp),
    });
    bottom.value = withTiming(
      Math.min(height - topInset - totalHeight, bottom.value),
      {
        duration: 400,
        easing: Easing.out(Easing.exp),
      },
    );
    opacity.value = withTiming(transactions.length === 0 ? 0 : 1, {
      duration: 400,
    });
    notificationWidth.value = withTiming(
      Math.min(notificationWidth.value, width - 40 - collapsedSize),
      {
        duration: 400,
        easing: Easing.out(Easing.exp),
      },
    );
  }, [transactions, collapsed]);

  useEffect(() => {
    if (expandType.status) {
      handleExpand(expandType.status);
    }
  }, [expandType]);

  const externalTransactions = useMemo(
    () => transactions.map((tx) => resolveExternalTransactionProposal(tx)),
    [transactions],
  );

  const statusCount = (status: ITransactionStatus) => {
    return externalTransactions.filter((tx) => tx.status === status).length;
  };

  const pendingCount = statusCount(ITransactionStatus.Pending);
  const droppedCount = statusCount(ITransactionStatus.Dropped);
  const failedCount = statusCount(ITransactionStatus.Failed);
  const successCount = statusCount(ITransactionStatus.Confirmed);

  const status = useMemo(
    () =>
      firstOf(
        tuple(pendingCount > 0, () => ITransactionStatus.Pending),
        tuple(droppedCount > 0, () => ITransactionStatus.Dropped),
        tuple(failedCount > 0, () => ITransactionStatus.Failed),
        tuple(successCount > 0, () => ITransactionStatus.Confirmed),
      ),
    [transactions],
  );
  const expandNotification = !!expandType.status && expanded;

  const pan = Gesture.Pan()
    .onStart(() => {
      if (Platform.OS === 'web') {
        runOnJS(setBeingDragged)(true);
      }
    })
    .onChange((event) => {
      if (collapsed && !expandNotification) {
        right.value -= event.changeX;
      }
      bottom.value -= event.changeY;
    })
    .onFinalize((event) => {
      if (collapsed) {
        right.value = withTiming(
          Math.min(Math.max(right.value, 16), width - 16 - collapsedSize),
          { duration: 200 },
        );
      }
      const totalHeight = collapsed ? collapsedSize : bannerHeight.value;
      bottom.value = withTiming(
        Math.min(
          Math.max(bottom.value, bottomPadding),
          height - topInset - totalHeight,
        ),
        { duration: 200 },
      );
      if (Platform.OS === 'web') {
        setTimeout(() => {
          runOnJS(setBeingDragged)(false);
        }, 100);
      }
    });

  return (
    <>
      {expandNotification && (
        <Animated.View
          style={[notificationStaticStyle, notificationAnimatedStyle]}
        >
          <ExpandNotification
            status={expandType.status!}
            onClose={() => {
              handleExpand(undefined);
            }}
          />
        </Animated.View>
      )}
      {transactions.length > 0 && !!status && (
        <GestureDetector gesture={pan}>
          <Animated.View style={[bannerStaticStyle, bannerAnimatedStyle]}>
            {!collapsed ? (
              <Blur
                disableBlur={Platform.OS === 'web'}
                intensity={18}
                className='rounded-2xl'
              >
                <View
                  className={cn(
                    'border-card-highlight w-full overflow-hidden rounded-2xl border backdrop-blur-sm',
                    {
                      'bg-card/80': Platform.OS !== 'android',
                      'bg-card/95': Platform.OS === 'android',
                    },
                  )}
                >
                  {transactions.slice(0, 6).map((transaction) => (
                    <ExpandedMetadata
                      key={transaction.id}
                      proposal={resolveExternalTransactionProposal(transaction)}
                      notification={false}
                      onPress={() =>
                        handleDismiss(
                          resolveExternalTransactionProposal(transaction),
                        )
                      }
                    />
                  ))}
                  <View className='px-4'>
                    <View className='bg-card-highlight-secondary h-[1px]' />
                  </View>
                  <View className='flex w-full flex-row items-center justify-between px-4 py-2'>
                    <View className='flex flex-row items-center space-x-1'>
                      {transactions.length > 6 && (
                        <View className='bg-card-highlight flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                          <Text className='text-text-secondary text-xs font-normal'>
                            {`${transactions.length - 6} More`}
                          </Text>
                        </View>
                      )}
                      {droppedCount + failedCount > 0 && (
                        <View className='bg-failure/10 flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                          <Text className='text-failure text-xs font-normal'>
                            {`${droppedCount + failedCount} Failed`}
                          </Text>
                        </View>
                      )}
                      {pendingCount > 0 && (
                        <View className='bg-primary/10 flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                          <Text className='text-primary text-xs font-normal'>
                            {`${pendingCount} Executing`}
                          </Text>
                        </View>
                      )}
                      {successCount > 0 && (
                        <View className='bg-success/10 flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                          <Text className='text-success text-xs font-normal'>
                            {`${successCount} Complete`}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className='flex flex-row items-center space-x-2'>
                      <BaseButton onPress={handleCollapse}>
                        <View
                          className='bg-card-highlight items-center justify-center rounded-lg'
                          style={withSize(adjust(24))}
                        >
                          <FontAwesomeIcon
                            icon={faMinimize}
                            size={adjust(14, 2)}
                            color={colors.textSecondary}
                          />
                        </View>
                      </BaseButton>
                    </View>
                  </View>
                </View>
              </Blur>
            ) : (
              <CollapsedMetadata status={status} onPress={handleCollapse} />
            )}
          </Animated.View>
        </GestureDetector>
      )}
    </>
  );
}

function CollapsedMetadata(props: {
  status: ITransactionStatus;
  onPress: VoidFunction;
}) {
  const { status, onPress } = props;

  return (
    <BaseButton
      className={cn('overflow-hidden', {
        'rounded-2xl': Platform.OS !== 'web',
        'rounded-xl': Platform.OS === 'web',
      })}
      onPress={onPress}
      scale={1}
    >
      <StatusIcon status={status} size={adjust(18, 4)} />
    </BaseButton>
  );
}

function ExpandNotification(props: {
  status: ITransactionStatus;
  onClose: VoidFunction;
}) {
  const { status, onClose } = props;

  const color =
    status === ITransactionStatus.Pending
      ? colors.primary
      : status === ITransactionStatus.Confirmed
      ? colors.success
      : colors.failure;
  const text =
    status === ITransactionStatus.Pending
      ? 'Transaction submitted!'
      : status === ITransactionStatus.Confirmed
      ? 'A transaction finished executing!'
      : status === ITransactionStatus.Failed
      ? 'A transaction has failed.'
      : 'A transaction has dropped.';
  const backgroundColor =
    Platform.OS === 'android'
      ? opacity(opaque(color, colors.background, 30), 90)
      : opacity(color, 30);

  return (
    <Blur
      disableBlur={Platform.OS === 'web'}
      intensity={18}
      className={cn({
        'rounded-2xl': Platform.OS !== 'web',
        'rounded-xl': Platform.OS === 'web',
      })}
    >
      <View
        className={cn(
          'flex flex-row items-center justify-between px-4 backdrop-blur-sm',
          {
            'rounded-2xl': Platform.OS !== 'web',
            'rounded-xl': Platform.OS === 'web',
          },
        )}
        style={{
          height: collapsedSize,
          backgroundColor,
        }}
      >
        <Text
          className='truncate text-sm font-medium'
          numberOfLines={1}
          style={{ color }}
        >
          {text}
        </Text>
        <BaseButton onPress={onClose}>
          <FontAwesomeIcon icon={faTimes} size={adjust(20, 2)} color={color} />
        </BaseButton>
      </View>
    </Blur>
  );
}

function StatusIcon(props: { status: ITransactionStatus; size: number }) {
  const { status, size } = props;

  const color =
    status === ITransactionStatus.Pending
      ? colors.primary
      : status === ITransactionStatus.Confirmed
      ? colors.success
      : colors.failure;
  const backgroundColor =
    Platform.OS === 'android'
      ? opacity(opaque(color, colors.background, 30), 90)
      : opacity(color, 30);

  return (
    <Blur
      disableBlur={Platform.OS === 'web'}
      intensity={18}
      className={cn({
        'rounded-2xl': Platform.OS !== 'web',
        'rounded-xl': Platform.OS === 'web',
      })}
    >
      <View
        className={cn('flex items-center justify-center backdrop-blur-sm', {
          'rounded-2xl': Platform.OS !== 'web',
          'rounded-xl': Platform.OS === 'web',
        })}
        style={{
          ...withSize(collapsedSize),
          backgroundColor,
        }}
      >
        {status === ITransactionStatus.Pending ? (
          <ActivityIndicator size={size} color={opacity(colors.primary, 80)} />
        ) : (
          <FontAwesomeIcon
            icon={faArrowUpRightAndArrowDownLeftFromCenter}
            size={size}
            color={color}
            transform={{ rotate: 270 }}
          />
        )}
      </View>
    </Blur>
  );
}

// TODO: this duplicated a lot of code with the history screen
export function ExpandedMetadata(props: {
  proposal: ExternalTransactionProposal;
  notification: boolean;
  onPress: VoidFunction;
}) {
  const { proposal, notification, onPress } = props;
  const { explore } = useLinkToBlockchainExplorer(proposal.chainId, {
    type: 'tx',
    data: proposal.txHash!,
  });

  const size = adjust(notification ? 36 : 24);
  const iconSize = adjust(notification ? 20 : 16, 2);
  const origin = parseOrigin(proposal);
  const originName = origin?.url
    ? new URL(withHttps(origin.url)).hostname
    : undefined;

  const isDropped = proposal.status === ITransactionStatus.Dropped;
  const metadata = proposal.metadata;

  const bridgeMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.Bridge,
  )?.bridge;
  const swapMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.Swap,
  )?.swap;
  const limitOrderMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.LimitOrder,
  )?.limitOrder;
  const tokenApprovalMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.TokenApproval,
  )?.tokenApproval;
  const nftApprovalMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.NftApproval,
  )?.nftApproval;
  const tokenTransferMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.TokenTransfer,
  )?.tokenTransfer;
  const nftTransferMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.NftTransfer,
  )?.nftTransfer;
  const tokenBurnMetadata =
    metadata?.filter((data) => data.type === ITransactionMetaType.TokenBurn) ??
    [];
  const nftBurnMetadata =
    metadata?.filter((data) => data.type === ITransactionMetaType.NftBurn) ??
    [];

  const link = isDropped ? undefined : (
    <BaseButton onPress={explore}>
      <View className='pl-1'>
        <FontAwesomeIcon
          icon={faArrowUpRightFromSquare}
          size={adjust(8, 2)}
          color={colors.textSecondary}
        />
      </View>
    </BaseButton>
  );

  return (
    <View className='flex flex-col'>
      {firstOf(
        tuple(!!bridgeMetadata, () => (
          <BasePendingItem
            action={
              <ActionItem
                icon={faBridgeWater}
                color={colors.bridge}
                text='Bridge'
                adornment={link}
              />
            }
            avatar={
              <SwapHistoryAvatar
                fromToken={bridgeMetadata!.inTokenMetadata}
                toToken={bridgeMetadata!.outTokenMetadata}
                fromChainId={bridgeMetadata!.fromChainId}
                toChainId={bridgeMetadata!.toChainId}
                size={size}
                borderColor={colors.card}
              />
            }
            title={bridgeMetadata!.outTokenMetadata.name}
            status={proposal.status}
            size={size}
            onPress={onPress}
          />
        )),
        tuple(!!swapMetadata, () => (
          <BasePendingItem
            action={
              <ActionItem
                icon={
                  swapMetadata!.swapType === ISwapType.Buy ||
                  swapMetadata!.swapType === ISwapType.Sell
                    ? faStore
                    : faShuffle
                }
                color={
                  swapMetadata!.swapType === ISwapType.Buy
                    ? colors.success
                    : swapMetadata!.swapType === ISwapType.Sell
                    ? colors.failure
                    : colors.swapLight
                }
                text={
                  swapMetadata!.swapType === ISwapType.Buy
                    ? 'Buy'
                    : swapMetadata!.swapType === ISwapType.Sell
                    ? 'Sell'
                    : 'Swap'
                }
                adornment={link}
              />
            }
            avatar={
              <SwapHistoryAvatar
                fromToken={
                  swapMetadata!.swapType === ISwapType.Sell
                    ? swapMetadata!.outTokenMetadata
                    : swapMetadata!.inTokenMetadata
                }
                toToken={
                  swapMetadata!.swapType === ISwapType.Sell
                    ? swapMetadata!.inTokenMetadata
                    : swapMetadata!.outTokenMetadata
                }
                toChainId={swapMetadata!.chainId}
                size={size}
                borderColor={colors.card}
              />
            }
            title={
              swapMetadata!.swapType === ISwapType.Sell
                ? `${formatCrypto(
                    swapMetadata!.inTokenAmount,
                    swapMetadata!.inTokenMetadata.decimals,
                  )} ${swapMetadata!.inTokenMetadata.symbol}`
                : `${formatCrypto(
                    swapMetadata!.outTokenAmount,
                    swapMetadata!.outTokenMetadata.decimals,
                  )}  ${swapMetadata!.outTokenMetadata.symbol}`
            }
            status={proposal.status}
            size={size}
            onPress={onPress}
          />
        )),
        tuple(!!limitOrderMetadata, () => {
          const primary =
            limitOrderMetadata!.orderType === ILimitOrderType.Buy
              ? limitOrderMetadata!.toTokenMetadata
              : limitOrderMetadata!.fromTokenMetadata;
          return (
            <BasePendingItem
              action={
                <ActionItem
                  icon={faScaleBalanced}
                  color={colors.swapLight}
                  text={
                    limitOrderMetadata!.orderType === ILimitOrderType.Buy
                      ? 'Limit Buy'
                      : 'Limit Sell'
                  }
                  adornment={link}
                />
              }
              avatar={
                <CryptoHistoryAvatar
                  token={primary}
                  chainId={limitOrderMetadata!.chainId}
                  size={size}
                  borderColor={colors.card}
                />
              }
              title={primary.name}
              status={proposal.status}
              size={size}
              onPress={onPress}
            />
          );
        }),
        tuple(!!tokenApprovalMetadata, () => {
          const isRevoke = BigInt(tokenApprovalMetadata!.amount) === 0n;
          return (
            <BasePendingItem
              action={
                <ActionItem
                  icon={isRevoke ? faBan : faBadgeCheck}
                  color={isRevoke ? colors.failure : colors.approve}
                  text={isRevoke ? 'Revoke' : 'Approve'}
                  adornment={link}
                />
              }
              avatar={
                <CryptoHistoryAvatar
                  token={tokenApprovalMetadata!.tokenMetadata}
                  chainId={tokenApprovalMetadata!.chainId}
                  size={size}
                  borderColor={colors.card}
                />
              }
              title={tokenApprovalMetadata!.tokenMetadata.name}
              status={proposal.status}
              size={size}
              onPress={onPress}
            />
          );
        }),
        tuple(!!tokenTransferMetadata, () => (
          <BasePendingItem
            action={
              <ActionItem
                icon={faPaperPlane}
                iconSizeAdjustment={-2}
                color={colors.send}
                text={'Send'}
                adornment={link}
              />
            }
            avatar={
              <CryptoHistoryAvatar
                token={tokenTransferMetadata!.tokenMetadata}
                chainId={tokenTransferMetadata!.chainId}
                size={size}
                borderColor={colors.card}
              />
            }
            title={tokenTransferMetadata!.tokenMetadata.name}
            status={proposal.status}
            size={size}
            onPress={onPress}
          />
        )),
        tuple(!!nftTransferMetadata, () => (
          <BasePendingItem
            action={
              <ActionItem
                icon={faPaperPlane}
                iconSizeAdjustment={-2}
                color={colors.send}
                text={'Send'}
                adornment={link}
              />
            }
            avatar={
              <NftHistoryAvatar
                imageUrl={nftTransferMetadata!.imageUrl}
                chainId={nftTransferMetadata!.chainId}
                size={size}
                borderColor={colors.card}
              />
            }
            title={nftTransferMetadata!.name}
            status={proposal.status}
            size={size}
            onPress={onPress}
          />
        )),
        tuple(
          tokenBurnMetadata.length + nftBurnMetadata.length > 0 &&
            proposal.chainId === ChainId.Solana,
          () => (
            <BasePendingItem
              action={
                <ActionItem
                  icon={faFire}
                  color={colors.failure}
                  text={'Burn'}
                  adornment={link}
                />
              }
              avatar={
                <HistoryAvatar
                  root={
                    <View
                      className='bg-card-highlight items-center justify-center rounded-full'
                      style={withSize(size)}
                    >
                      <FontAwesomeIcon
                        icon={faCode}
                        color={colors.textPrimary}
                        size={adjust(16, 2)}
                      />
                    </View>
                  }
                  chainId={proposal.chainId}
                  size={adjust(size)}
                  borderColor={colors.card}
                />
              }
              title={'Close Token Accounts'}
              status={proposal.status}
              size={size}
              onPress={onPress}
            />
          ),
        ),
        tuple(true, () => (
          <BasePendingItem
            action={
              <ActionItem
                icon={isDropped ? faQuestionCircle : faHourglassStart}
                iconSizeAdjustment={isDropped ? 0 : -2}
                color={isDropped ? colors.failure : colors.primary}
                text={'Execute'}
                adornment={link}
              />
            }
            avatar={
              <HistoryAvatar
                root={
                  origin ? (
                    <OriginImage uri={origin.favIconUrl} size={size} />
                  ) : (
                    <View
                      className='bg-card-highlight items-center justify-center rounded-full'
                      style={withSize(size)}
                    >
                      <FontAwesomeIcon
                        icon={faCode}
                        color={colors.textPrimary}
                        size={iconSize}
                      />
                    </View>
                  )
                }
                chainId={proposal.chainId}
                borderColor={colors.card}
                size={size}
              />
            }
            title={originName ?? 'Pending Transaction'}
            status={proposal.status}
            size={size}
            onPress={onPress}
          />
        )),
      )}
      {proposal.chainId === ChainId.Solana &&
        proposal.status === ITransactionStatus.Failed &&
        !!(proposal as ISvmKeyTransactionProposal).errorMessage && (
          <View className='bg-failure/10 mx-4 mb-2 rounded-lg px-4 py-2'>
            <Text
              className='text-failure truncate text-xs font-normal'
              numberOfLines={1}
            >
              {(proposal as ISvmKeyTransactionProposal).errorMessage}
            </Text>
          </View>
        )}
    </View>
  );
}

export function BasePendingItem(props: {
  avatar: React.ReactNode;
  action: React.ReactNode;
  title: string;
  size: number;
  status: ITransactionStatus;
  onPress: VoidFunction;
}) {
  const { avatar, title, action, size, status, onPress } = props;

  const color =
    status === ITransactionStatus.Pending
      ? colors.primary
      : status === ITransactionStatus.Confirmed
      ? colors.success
      : colors.failure;

  return (
    <View className='flex h-16 flex-row items-center justify-between space-x-2 overflow-hidden rounded-2xl px-4'>
      <View
        className='h-8 w-[3px] rounded-full'
        style={{ backgroundColor: color }}
      />
      <View className='ml-1 flex flex-1 flex-row items-center space-x-4'>
        <View
          className='flex flex-none flex-row items-center justify-center rounded-full'
          style={withSize(size)}
        >
          {avatar}
        </View>
        <View className='flex flex-1 flex-col space-y-0.5 overflow-hidden'>
          {action}
          <Text
            className='text-text-primary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View className='flex flex-col overflow-hidden'>
          <View className='flex flex-row items-center justify-end'>
            <View
              className='flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'
              style={{ backgroundColor: opacity(color, 10) }}
            >
              {status === ITransactionStatus.Pending && (
                <ActivityIndicator size={adjust(12, 2)} />
              )}
              <Text className='text-xs font-normal' style={{ color }}>
                {status === ITransactionStatus.Pending
                  ? 'Executing'
                  : status === ITransactionStatus.Confirmed
                  ? 'Executed'
                  : status === ITransactionStatus.Dropped
                  ? 'Dropped'
                  : status === ITransactionStatus.Failed
                  ? 'Failed'
                  : 'Not Found'}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <View className='flex h-16 flex-col items-center justify-center py-1.5'>
        <BaseButton onPress={onPress}>
          <View
            className='bg-card-highlight items-center justify-center rounded-lg'
            style={withSize(adjust(24))}
          >
            <FontAwesomeIcon
              icon={faMinus}
              color={colors.textSecondary}
              size={adjust(12, 2)}
            />
          </View>
        </BaseButton>
      </View>
    </View>
  );
}
