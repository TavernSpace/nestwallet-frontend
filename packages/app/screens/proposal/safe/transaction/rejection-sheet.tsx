import { useState } from 'react';
import { TextButton } from '../../../../components/button/text-button';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { parseError } from '../../../../features/errors';
import { ISafeTransactionProposal } from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { useSafeTransactionProposalContext } from '../../../../provider/safe-transaction-proposal';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { localization } from './localization';

export function SafeTransactionProposalRejectionSheet(props: {
  isShowing: boolean;
  onClose: VoidFunction;
  onSubmit: (proposal: ISafeTransactionProposal) => Promise<void>;
}) {
  const { isShowing, onClose, onSubmit } = props;
  const { language } = useLanguageContext();
  const { proposal } = useSafeTransactionProposalContext();
  const { showSnackbar } = useSnackbar();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const nonce = proposal.safeNonce!;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(proposal);
    } catch (err) {
      const { message } = parseError(
        err,
        localization.failedToCreateRejection[language],
      );
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: message,
      });
    }
    setIsSubmitting(false);
  };

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title={localization.rejectTransactionWithNonce[language]}
        onClose={onClose}
        type='detached'
      />
      <View className='flex flex-col space-y-4 px-4'>
        <Text className='text-text-secondary text-sm font-normal'>
          {localization.replaceTransaction(nonce)[language]}
        </Text>
        <TextButton
          text={localization.createRejectionTransaction[language]}
          type='primary'
          loading={isSubmitting}
          disabled={isSubmitting}
          onPress={handleSubmit}
        />
      </View>
    </ActionSheet>
  );
}
