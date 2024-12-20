import { useEffect, useState } from 'react';
import { SignatureType } from '../../../common/types';
import { ActionSheet } from '../../../components/sheet';
import { parseError } from '../../../features/errors';
import { TypedData } from '../../../features/keyring/types';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { SigningSheetPendingContent } from '../safe/signing-sheet/pending';

type ISigningSheetProps = {
  wallet: IWallet;
  type: SignatureType;
  typedData?: TypedData;
  isShowing: boolean;
  onClose: VoidFunction;
  onCompleted: VoidFunction;
  onSign: () => Promise<void>;
};

export function SigningSheet(props: ISigningSheetProps) {
  const { wallet, type, typedData, isShowing, onClose, onCompleted, onSign } =
    props;

  const [error, setError] = useState<Error>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // important: do not trigger on anything other than isShowing
  useEffect(() => {
    if (isShowing) {
      handleSign();
    }
  }, [isShowing]);

  const handleSign = async () => {
    try {
      setIsSubmitting(true);
      setError(undefined);
      await onSign();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    await handleSign();
  };

  return (
    <ActionSheet
      isShowing={isShowing}
      gestureEnabled={false}
      isFullHeight={true}
      onClose={onClose}
    >
      <SigningSheetPendingContent
        wallet={wallet}
        typedData={typedData}
        isLoading={isSubmitting}
        error={error}
        type={type}
        onRetry={handleRetry}
        onClose={onClose}
        onDone={onCompleted}
      />
    </ActionSheet>
  );
}
