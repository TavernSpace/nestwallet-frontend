import { useEffect, useState } from 'react';
import { SignatureType, VoidPromiseFunction } from '../../../common/types';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { parseError } from '../../../features/errors';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { SigningSheetPendingContent } from '../safe/signing-sheet/pending';

interface TrezorRequestScreenProps {
  wallet: IWallet;
  type: SignatureType;
  onRequest: VoidPromiseFunction;
  onCancel: VoidFunction;
}

export function TrezorRequestScreen(props: TrezorRequestScreenProps) {
  const { wallet, type, onRequest, onCancel } = props;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const handleRequest = async () => {
    try {
      setError(undefined);
      setLoading(true);
      await onRequest();
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRequest();
  }, []);

  return (
    <View className='h-full w-full'>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <SigningSheetPendingContent
          wallet={wallet}
          isLoading={loading}
          error={error}
          type={type}
          onRetry={handleRequest}
          onClose={onCancel}
          onDone={onCancel}
        />
      </ViewWithInset>
    </View>
  );
}
