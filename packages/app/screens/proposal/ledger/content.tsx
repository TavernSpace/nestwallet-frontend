import {
  faBadgeCheck,
  faCheck,
  faChevronsRight,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { useEffect, useState } from 'react';
import { formatCrypto } from '../../../common/format/number';
import { linkToBlockchainExplorer } from '../../../common/hooks/link';
import { adjust } from '../../../common/utils/style';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { InlineErrorTooltip } from '../../../components/input-error';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { parseError } from '../../../features/errors';
import {
  ICryptoBalance,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ExecutionSheetErrorContent } from '../execution-sheet/error';
import { ExecutionSheetLoadingContent } from '../execution-sheet/loading';
import {
  ExecutionSheetSuccessContent,
  ExecutionSuccessContentStatic,
} from '../execution-sheet/success';
import { localization } from './localization';

interface LedgerSwapSigningSheetContentProps {
  requiresApproval: boolean;
  isFullScreen: boolean;
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  inputAmount: string;
  outputAmount: string;
  onClose: VoidFunction;
  onExecute: (onApprove: VoidFunction) => Promise<string | void>;
  onCompleted: VoidFunction;
}

export function LedgerSwapSigningSheetContent(
  props: LedgerSwapSigningSheetContentProps,
) {
  const { requiresApproval, isFullScreen, fromAsset, onExecute, onCompleted } =
    props;
  const [error, setError] = useState<Error>();
  const [txHash, setTxHash] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [approvalComplete, setApprovalComplete] = useState(!requiresApproval);

  const handleExecute = async () => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      const txHash = await onExecute(() => setApprovalComplete(true));
      if (txHash) {
        setTxHash(txHash);
      }
      setIsComplete(true);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsSubmitting(false);
      setApprovalComplete(false);
    }
  };

  const handleExplore = () => {
    if (txHash) {
      linkToBlockchainExplorer(fromAsset.chainId, {
        type: 'tx',
        data: txHash,
      });
      onCompleted();
    }
  };

  return isFullScreen ? (
    <FullScreenContent
      {...props}
      txHash={txHash}
      error={error}
      isComplete={isComplete}
      isSubmitting={isSubmitting}
      approvalComplete={approvalComplete}
      onExplore={handleExplore}
      onExecute={handleExecute}
    />
  ) : (
    <DetachedContent
      {...props}
      txHash={txHash}
      error={error}
      isComplete={isComplete}
      isSubmitting={isSubmitting}
      approvalComplete={approvalComplete}
      onExplore={handleExplore}
      onExecute={handleExecute}
    />
  );
}

interface LedgerSwapContentProps {
  requiresApproval: boolean;
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  inputAmount: string;
  outputAmount: string;
  txHash?: string;
  error?: Error;
  isSubmitting: boolean;
  isComplete: boolean;
  approvalComplete: boolean;
  onClose: VoidFunction;
  onExecute: VoidFunction;
  onCompleted: VoidFunction;
  onExplore: VoidFunction;
}

function DetachedContent(props: LedgerSwapContentProps) {
  const {
    requiresApproval,
    fromAsset,
    toAsset,
    inputAmount,
    outputAmount,
    txHash,
    error,
    isSubmitting,
    isComplete,
    approvalComplete,
    onClose,
    onCompleted,
    onExecute,
    onExplore,
  } = props;
  const { language } = useLanguageContext();

  return isComplete ? (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title={localization.executionSuccess[language]}
        onClose={onClose}
        type='detached'
      />
      <ExecutionSuccessContentStatic
        successTitle={localization.transactionSubmitted[language]}
        onDone={onCompleted}
        onExplore={onExplore}
        txHash={txHash}
      />
    </View>
  ) : (
    <View className='flex flex-col'>
      <ActionSheetHeader
        title={localization.confirmTransaction[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='px-4'>
        <SwapAction
          requiresApproval={requiresApproval}
          fromAsset={fromAsset}
          toAsset={toAsset}
          inputAmount={inputAmount}
          outputAmount={outputAmount}
          isComplete={isComplete}
          approvalComplete={approvalComplete}
        />
      </View>
      <View className='mt-2 flex flex-col space-y-2 px-4'>
        {error && (
          <View className='flex w-full flex-row items-center'>
            <InlineErrorTooltip errorText={error.message} isEnabled={true} />
          </View>
        )}
        <View className='mt-2 flex flex-row items-center space-x-4'>
          <TextButton
            className='flex-1'
            text={localization.cancel[language]}
            type='tertiary'
            disabled={isSubmitting}
            onPress={onClose}
          />
          <TextButton
            className='flex-1'
            text={
              error
                ? localization.retry[language]
                : localization.execute[language]
            }
            loading={isSubmitting}
            disabled={isSubmitting}
            onPress={onExecute}
          />
        </View>
      </View>
    </View>
  );
}

function FullScreenContent(props: LedgerSwapContentProps) {
  const {
    requiresApproval,
    fromAsset,
    toAsset,
    inputAmount,
    outputAmount,
    txHash,
    error,
    isSubmitting,
    isComplete,
    approvalComplete,
    onClose,
    onCompleted,
    onExecute,
    onExplore,
  } = props;
  const { language } = useLanguageContext();

  useEffect(() => {
    onExecute();
  }, []);

  return isComplete ? (
    <ExecutionSheetSuccessContent
      successTitle={localization.transactionSubmitted[language]}
      onDone={onCompleted}
      onExplore={onExplore}
      txHash={txHash}
    />
  ) : error ? (
    <ExecutionSheetErrorContent
      error={error}
      onClose={onClose}
      onRetry={onExecute}
    />
  ) : (
    <ExecutionSheetLoadingContent walletType={IWalletType.Ledger}>
      <View className='mt-4'>
        <SwapAction
          requiresApproval={requiresApproval}
          fromAsset={fromAsset}
          toAsset={toAsset}
          inputAmount={inputAmount}
          outputAmount={outputAmount}
          isComplete={isComplete}
          approvalComplete={approvalComplete}
        />
      </View>
    </ExecutionSheetLoadingContent>
  );
}

function SwapAction(props: {
  requiresApproval: boolean;
  fromAsset: ICryptoBalance;
  toAsset: ICryptoBalance;
  inputAmount: string;
  outputAmount: string;
  approvalComplete: boolean;
  isComplete: boolean;
}) {
  const {
    requiresApproval,
    fromAsset,
    toAsset,
    inputAmount,
    outputAmount,
    isComplete,
    approvalComplete,
  } = props;
  const { language } = useLanguageContext();

  return (
    <View className='bg-card flex flex-col space-y-6 rounded-2xl px-4 py-3'>
      {requiresApproval && (
        <View className='flex flex-row items-center justify-between space-x-4'>
          <View className='flex flex-row items-center space-x-3'>
            <View
              className={cn(
                'h-4 w-4 items-center justify-center rounded-full',
                {
                  'bg-success/10': approvalComplete,
                  'bg-card-highlight': !approvalComplete,
                },
              )}
            >
              {approvalComplete && (
                <FontAwesomeIcon
                  icon={faCheck}
                  color={colors.success}
                  size={adjust(10, 2)}
                />
              )}
            </View>
            <CryptoAvatar
              url={fromAsset.tokenMetadata.imageUrl}
              chainId={fromAsset.chainId}
              symbol={fromAsset.tokenMetadata.symbol}
              size={adjust(36)}
              chainBorderColor={colors.card}
            />
            <View className='flex flex-col'>
              <Text className='text-text-primary text-sm font-medium'>
                {fromAsset.tokenMetadata.name}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {fromAsset.tokenMetadata.symbol}
              </Text>
            </View>
          </View>
          <View className='flex flex-row space-x-3'>
            <View className='bg-approve/10 h-9 w-9 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faBadgeCheck}
                size={adjust(24, 2)}
                color={colors.approve}
              />
            </View>
            <View className='flex flex-col'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.approve[language]}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {fromAsset.tokenMetadata.symbol}
              </Text>
            </View>
          </View>
        </View>
      )}
      <View className='flex flex-row items-center justify-between space-x-4'>
        <View className='flex flex-row items-center space-x-3'>
          <View
            className={cn('h-4 w-4 items-center justify-center rounded-full', {
              'bg-success/10': isComplete,
              'bg-card-highlight': !isComplete,
            })}
          >
            {isComplete && (
              <FontAwesomeIcon
                icon={faCheck}
                color={colors.success}
                size={adjust(10, 2)}
              />
            )}
          </View>
          <CryptoAvatar
            url={fromAsset.tokenMetadata.imageUrl}
            chainId={fromAsset.chainId}
            symbol={fromAsset.tokenMetadata.symbol}
            chainBorderColor={colors.card}
            size={adjust(36)}
          />
          <View className='flex flex-col'>
            <Text className='text-text-primary text-sm font-medium'>
              {fromAsset.tokenMetadata.symbol}
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatCrypto(inputAmount, fromAsset.tokenMetadata.decimals)}
            </Text>
          </View>
        </View>
        <FontAwesomeIcon
          icon={faChevronsRight}
          color={colors.swapLight}
          size={adjust(14, 2)}
        />
        <View className='flex flex-row space-x-3'>
          <CryptoAvatar
            url={toAsset.tokenMetadata.imageUrl}
            chainId={toAsset.chainId}
            symbol={toAsset.tokenMetadata.symbol}
            chainBorderColor={colors.card}
            size={adjust(36)}
          />
          <View className='flex flex-col'>
            <Text className='text-text-primary text-sm font-medium'>
              {toAsset.tokenMetadata.symbol}
            </Text>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatCrypto(outputAmount, toAsset.tokenMetadata.decimals)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
