import { useEffect, useState } from 'react';
import { linkToBlockchainExplorer } from '../../../common/hooks/link';
import { ActionSheet } from '../../../components/sheet';
import { onBlockchain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import {
  IBlockchainType,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ExecutionSheetContent } from './content';
import { localization } from './localization';

type ExecutionSheetProps = {
  chainId: number;
  blockchain: IBlockchainType;
  executor?: IWallet | null;
  isShowing: boolean;
  onClose: VoidFunction;
  onCompleted: VoidFunction;
  onExecute: () => Promise<string | undefined>;
};

export function ExecutionSheet(props: ExecutionSheetProps) {
  const {
    chainId,
    blockchain,
    executor,
    isShowing,
    onClose,
    onCompleted,
    onExecute,
  } = props;
  const { language } = useLanguageContext();

  const [error, setError] = useState<Error>();
  const [txHash, setTxHash] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // important: do not trigger on anything other than isShowing
  useEffect(() => {
    if (isShowing) {
      handleExecute();
    }
  }, [isShowing]);

  const handleExecute = async () => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      const txHash = await onExecute();
      setTxHash(txHash);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExplore = () => {
    linkToBlockchainExplorer(
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
    onCompleted();
  };

  const handleRetry = async () => {
    await handleExecute();
  };

  return (
    <ActionSheet
      isShowing={isShowing}
      gestureEnabled={false}
      isFullHeight={true}
      onClose={onClose}
    >
      <ExecutionSheetContent
        chainId={chainId}
        blockchain={blockchain}
        executor={executor}
        txHash={txHash}
        error={error}
        isLoading={isSubmitting}
        successTitle={localization.transactionSubmitted[language]}
        onRetry={handleRetry}
        onClose={onClose}
        onDone={onCompleted}
        onExplore={handleExplore}
      />
    </ActionSheet>
  );
}
