import { useLinkToBlockchainExplorer } from '../../../common/hooks/link';
import { onBlockchain } from '../../../features/chain';
import {
  IBlockchainType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { ExecutionSheetErrorContent } from './error';
import { ExecutionSheetLoadingContent } from './loading';
import { ExecutionSheetSuccessContent } from './success';

export function ExecutionSheetContent(props: {
  executor?: IWallet | null;
  blockchain: IBlockchainType;
  txHash?: string;
  chainId: number;
  successTitle: string;
  successSubtitle?: string;
  isLoading: boolean;
  error?: Error;
  onRetry: VoidFunction;
  onClose: VoidFunction;
  onDone: VoidFunction;
  onExplore?: VoidFunction;
}) {
  const {
    txHash,
    chainId,
    blockchain,
    successTitle,
    successSubtitle,
    executor,
    isLoading,
    error,
    onRetry,
    onClose,
    onDone,
    onExplore,
  } = props;
  const { explore } = useLinkToBlockchainExplorer(
    chainId,
    onBlockchain(blockchain)(
      () => ({
        type: 'tx',
        data: txHash,
      }),
      () => ({
        type: 'tx',
        data: txHash,
      }),
      () => ({
        type: 'address',
        data: executor?.address,
      }),
    ),
  );

  return isLoading ? (
    <ExecutionSheetLoadingContent walletType={executor?.type} />
  ) : error ? (
    <ExecutionSheetErrorContent
      error={error}
      onRetry={onRetry}
      onClose={onClose}
    />
  ) : (
    <ExecutionSheetSuccessContent
      successTitle={successTitle}
      onDone={onDone}
      onExplore={onExplore || explore}
      txHash={txHash}
      successSubtitle={successSubtitle}
    />
  );
}
