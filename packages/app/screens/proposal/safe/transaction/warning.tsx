import { SafeInfoResponse } from '@safe-global/api-kit';
import _ from 'lodash';
import { WarningBanner } from '../../../../components/banner/warning';
import { View } from '../../../../components/view';
import { isRejectionSafeTransactionProposal } from '../../../../features/proposal/nonce';
import { ISafeTransactionProposal } from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

export function SafeTransactionProposalWarnings(props: {
  proposal: ISafeTransactionProposal;
  isExecuted: boolean;
  isExecuting: boolean;
  nonces?: number[];
  safeInfo: SafeInfoResponse;
  safeNonce: number;
}) {
  const { proposal, isExecuted, isExecuting, nonces, safeInfo, safeNonce } =
    props;
  const { language } = useLanguageContext();
  const isRejection = isRejectionSafeTransactionProposal(proposal);
  const showExpiredNonceWarning =
    !isExecuted &&
    !isExecuting &&
    !_.isNil(proposal.safeNonce) &&
    proposal.safeNonce < safeInfo.nonce;
  const showDuplicateNonceWarning =
    !isRejection &&
    !isExecuted &&
    !isExecuting &&
    !showExpiredNonceWarning &&
    !_.isNil(proposal.safeNonce) &&
    nonces &&
    nonces.filter((nonce) => nonce === safeNonce).length > 1;

  if (!showDuplicateNonceWarning && !showExpiredNonceWarning) {
    return null;
  }

  return (
    <View className='flex w-full flex-col space-y-1.5 px-4'>
      {showExpiredNonceWarning && (
        <WarningBanner
          title={localization.expiredNonce[language]}
          body={localization.expiredNonceBody[language]}
        />
      )}
      {showDuplicateNonceWarning && (
        <WarningBanner
          title={localization.duplicateNonce[language]}
          body={localization.duplicateNonceBody(proposal.safeNonce!)[language]}
        />
      )}
    </View>
  );
}
