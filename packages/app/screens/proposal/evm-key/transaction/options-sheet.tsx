import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faCircleX,
} from '@fortawesome/pro-solid-svg-icons';
import { useLinkToBlockchainExplorer } from '../../../../common/hooks/link';
import { ExternalTransactionProposal } from '../../../../common/types';
import { adjust } from '../../../../common/utils/style';
import { ActivityIndicator } from '../../../../components/activity-indicator';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { ITransactionStatus } from '../../../../graphql/client/generated/graphql';
import { useEoaTransactionProposalContext } from '../../../../provider/eoa-transaction-proposal';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface EoaTransactionProposalOptionProps {
  isShowing: boolean;
  onClose: VoidFunction;
}

export function EoaTransactionProposalOptionsSheet(
  props: EoaTransactionProposalOptionProps,
) {
  const { isShowing, onClose } = props;
  const { transaction } = useEoaTransactionProposalContext();
  const { language } = useLanguageContext();

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title={localization.viewTransaction[language]}
        onClose={onClose}
        type='detached'
      />
      <EoaTransactionProposalOptionSheetContent
        {...props}
        proposal={transaction}
      />
    </ActionSheet>
  );
}

function EoaTransactionProposalOptionSheetContent(
  props: EoaTransactionProposalOptionProps & {
    proposal: ExternalTransactionProposal;
  },
) {
  const { proposal } = props;
  const { explore } = useLinkToBlockchainExplorer(proposal.chainId, {
    type: 'tx',
    data: proposal.txHash,
  });
  const { language } = useLanguageContext();

  const size = adjust(48);

  return proposal.txHash ? (
    <View className='mt-4 flex flex-col space-y-3 px-4'>
      {proposal.status === ITransactionStatus.Confirmed ? (
        <Text className='text-text-secondary text-center text-sm font-medium'>
          {localization.yourTransactionHasBeen[language]}
          <Text className='text-success text-center text-sm font-bold'>
            {localization.executed[language]}
          </Text>
        </Text>
      ) : proposal.status === ITransactionStatus.Pending ? (
        <Text className='text-text-secondary text-center text-sm font-medium'>
          {localization.yourTransactionIsCurrently[language]}
          <Text className='text-primary text-center text-sm font-bold'>
            {localization.executing[language]}
          </Text>
        </Text>
      ) : proposal.status === ITransactionStatus.Failed ? (
        <Text className='text-text-secondary text-center text-sm font-medium'>
          {localization.executionRevertedOnChain[language]}
          <Text className='text-failure text-center text-sm font-bold'>
            {localization.failed[language]}
          </Text>
        </Text>
      ) : proposal.status === ITransactionStatus.Dropped ? (
        <Text className='text-text-secondary text-center text-sm font-medium'>
          {localization.yourTransactionWasDropped[language]}
        </Text>
      ) : null}
      <View className='mx-auto'>
        {proposal.status === ITransactionStatus.Confirmed ? (
          <FontAwesomeIcon
            icon={faCircleCheck}
            size={size}
            className='text-success'
          />
        ) : proposal.status === ITransactionStatus.Pending ? (
          <ActivityIndicator />
        ) : (
          <FontAwesomeIcon
            icon={faCircleX}
            size={size}
            className='text-failure'
          />
        )}
      </View>
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
    </View>
  ) : (
    <View className='px-4'>
      <Text className='text-text-secondary text-sm font-normal'>
        {localization.onceTransactionIsExecuted[language]}
      </Text>
    </View>
  );
}
