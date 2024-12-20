import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark,
} from '@fortawesome/pro-solid-svg-icons';
import { SafeInfoResponse } from '@safe-global/api-kit';
import _ from 'lodash';
import { useLinkToBlockchainExplorer } from '../../../../common/hooks/link';
import { Loadable } from '../../../../common/types';
import { adjust } from '../../../../common/utils/style';
import { ActivityIndicator } from '../../../../components/activity-indicator';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import {
  SafeTxState,
  getSafeTxStateFromSafeTransactionProposal,
} from '../../../../features/safe/utils';
import {
  IProposalState,
  ISafeTransactionProposal,
} from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { useSafeTransactionProposalContext } from '../../../../provider/safe-transaction-proposal';
import { localization } from './localization';

interface SafeTransactionProposalOptionProps {
  isShowing: boolean;
  onClose: VoidFunction;
}

export function SafeTransactionProposalOptionsSheet(
  props: SafeTransactionProposalOptionProps,
) {
  const { isShowing, onClose } = props;
  const { language } = useLanguageContext();
  const { proposal, safeInfo } = useSafeTransactionProposalContext();

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title={localization.viewTransaction[language]}
        onClose={onClose}
        type='detached'
      />
      <SafeTransactionProposalOptionSheetContent
        {...props}
        proposal={proposal}
        safeInfo={safeInfo}
      />
    </ActionSheet>
  );
}

function SafeTransactionProposalOptionSheetContent(
  props: SafeTransactionProposalOptionProps & {
    safeInfo: Loadable<SafeInfoResponse>;
    proposal: ISafeTransactionProposal;
  },
) {
  const { safeInfo, proposal } = props;
  const { language } = useLanguageContext();
  const { explore } = useLinkToBlockchainExplorer(proposal.chainId, {
    type: 'tx',
    data: proposal.txHash,
  });

  if (safeInfo.loading) {
    return (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    );
  } else if (safeInfo.error) {
    return null;
  }

  const proposalState = getSafeTxStateFromSafeTransactionProposal(
    safeInfo.data,
    proposal,
  );
  const isExecuted = proposalState === SafeTxState.Executed;
  const isExecuting = proposalState === SafeTxState.Executing;
  const isFailed = proposalState === SafeTxState.Failed;
  const isReplaced =
    proposal.state === IProposalState.Invalid ||
    (!_.isNil(proposal.safeNonce) && proposal.safeNonce < safeInfo.data.nonce);
  const size = adjust(48);

  return proposal.txHash || isReplaced ? (
    <View className='flex flex-col space-y-3 px-4'>
      {isExecuted ? (
        <Text className='text-text-primary text-center text-sm font-medium'>
          {localization.yourTransactionHasBeen[language]}
          <Text className='text-success text-center text-sm font-bold'>
            {localization.executed[language]}
          </Text>
        </Text>
      ) : isExecuting ? (
        <Text className='text-text-primary text-center text-sm font-medium'>
          {localization.yourTransactionIsCurrently[language]}
          <Text className='text-primary text-center text-sm font-bold'>
            {localization.executing[language]}
          </Text>
        </Text>
      ) : isFailed ? (
        <Text className='text-text-primary text-center text-sm font-medium'>
          {localization.yourTransactionWasOnly[language]}
          <Text className='text-failure text-center text-sm font-bold'>
            {localization.partiallyExecuted[language]}
          </Text>
        </Text>
      ) : isReplaced ? (
        <Text className='text-text-primary text-center text-sm font-medium'>
          {localization.thisTransactionWas[language]}
          <Text className='text-primary text-center text-sm font-bold'>
            {localization.replaced[language]}
          </Text>
        </Text>
      ) : (
        <Text className='text-text-primary text-center text-sm font-medium'>
          {localization.yourTransactionWas[language]}
          <Text className='text-failure text-center text-sm font-bold'>
            {localization.dropped[language]}
          </Text>
        </Text>
      )}
      <View className='mx-auto'>
        {isExecuted ? (
          <FontAwesomeIcon
            icon={faCircleCheck}
            size={size}
            className='text-success'
          />
        ) : isExecuting ? (
          <ActivityIndicator />
        ) : isReplaced ? (
          <FontAwesomeIcon
            icon={faCircleExclamation}
            size={size}
            className='text-primary'
          />
        ) : (
          <FontAwesomeIcon
            icon={faCircleXmark}
            size={size}
            className='text-failure'
          />
        )}
      </View>
      {proposal.txHash && (
        <BaseButton className='overflow-hidden rounded-full' onPress={explore}>
          <View className='flex flex-row items-center justify-center space-x-1 px-2 py-1'>
            <Text className='text-text-primary text-sm font-bold'>
              {localization.viewOnBlockExplorer[language]}
            </Text>
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              size={adjust(12, 2)}
              color={colors.textPrimary}
            />
          </View>
        </BaseButton>
      )}
    </View>
  ) : null;
}
