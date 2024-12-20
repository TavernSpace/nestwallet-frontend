import { faAngleRight } from '@fortawesome/pro-solid-svg-icons';
import { SafeInfoResponse } from '@safe-global/api-kit';
import cn from 'classnames';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { adjust } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { UserAvatar } from '../../components/avatar/user-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import {
  SafeTxState,
  getSafeTxStateFromSafeTransactionProposal,
} from '../../features/safe/utils';
import {
  ISafeMessageProposal,
  ISafeTransactionProposal,
} from '../../graphql/client/generated/graphql';

export function SafeTransactionProposalListItem(props: {
  proposal: ISafeTransactionProposal;
  safeInfo: SafeInfoResponse;
  onPress: VoidFunction;
}) {
  const { proposal, safeInfo, onPress } = props;

  const proposalState = getSafeTxStateFromSafeTransactionProposal(
    safeInfo,
    proposal,
  );
  const size = adjust(36);

  return (
    <BaseButton onPress={onPress} animationEnabled={false}>
      <View className='flex flex-row items-center justify-between space-x-2 overflow-hidden px-4 py-4'>
        <View className='flex flex-1 flex-row space-x-3'>
          <View className='my-auto flex flex-none flex-row items-center justify-center overflow-hidden rounded-full'>
            {proposalState === SafeTxState.Executing ? (
              <ActivityIndicator size={size} />
            ) : (
              <UserAvatar
                user={proposal.createdBy ?? undefined}
                imageUrl={proposal.originImageURL ?? undefined}
                size={size}
              />
            )}
          </View>

          <View className='flex flex-1 flex-col space-y-1 overflow-hidden pl-2'>
            <View className='flex flex-row items-center justify-start space-x-1'>
              <Text
                className='text-text-primary flex-initial truncate text-sm font-medium'
                numberOfLines={1}
              >
                {proposal.createdBy?.name || proposal.originName || 'Signer'}
              </Text>
              <Text
                className='text-text-secondary flex-none text-xs font-normal'
                numberOfLines={1}
              >
                {!isNil(proposal.safeNonce)
                  ? `• Nonce #${proposal.safeNonce}`
                  : '• Nonce not set'}
              </Text>
            </View>
            {proposal.description ? (
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {proposal.description}
              </Text>
            ) : (
              <Text
                className='text-text-secondary truncate text-xs font-normal italic'
                numberOfLines={1}
              >
                No Description
              </Text>
            )}
          </View>
        </View>
        {proposalState <= SafeTxState.ReadyToExecute && (
          <View
            className={cn(
              'flex flex-none flex-row items-center justify-center space-x-1 space-y-[1px] rounded-md px-2 py-1',
              {
                'bg-success/10': proposalState === SafeTxState.ReadyToExecute,
                'bg-failure/10':
                  proposalState === SafeTxState.NotCreated ||
                  proposalState === SafeTxState.MissingSignature,
              },
            )}
          >
            <Text
              className={cn('inline-flex items-center text-xs font-medium', {
                'text-success': proposalState === SafeTxState.ReadyToExecute,
                'text-failure':
                  proposalState === SafeTxState.NotCreated ||
                  proposalState === SafeTxState.MissingSignature,
              })}
            >
              {proposalState === SafeTxState.ReadyToExecute
                ? 'Execute'
                : 'Sign'}
            </Text>
            <FontAwesomeIcon
              icon={faAngleRight}
              size={adjust(10, 2)}
              className={cn(
                proposalState === SafeTxState.ReadyToExecute
                  ? 'text-success'
                  : 'text-failure',
              )}
            />
          </View>
        )}

        {proposalState === SafeTxState.Executing && (
          <View className='bg-primary/10 flex flex-none flex-row items-center space-x-2 rounded-md px-2 py-1'>
            <ActivityIndicator size={adjust(12, 2)} />
            <Text className='text-primary text-xs font-medium'>Executing</Text>
          </View>
        )}
      </View>
    </BaseButton>
  );
}

export function SafeMessageProposalListItem(props: {
  message: ISafeMessageProposal;
  onPress: VoidFunction;
}) {
  const { message, onPress } = props;

  const size = adjust(36);

  return (
    <BaseButton onPress={onPress} animationEnabled={false}>
      <View className='flex flex-row items-center justify-between space-x-2 overflow-hidden px-4 py-4'>
        <View className='flex flex-1 flex-row space-x-3'>
          <View className='my-auto flex flex-none flex-row items-center justify-center overflow-hidden rounded-full'>
            <UserAvatar
              user={message.createdBy ?? undefined}
              imageUrl={message.originImageURL ?? undefined}
              size={size}
            />
          </View>
          <View className='flex flex-1 flex-col space-y-1 overflow-hidden pl-2'>
            <View className='flex flex-row items-center justify-start space-x-1'>
              <Text
                className='text-text-primary flex-initial truncate text-sm font-medium'
                numberOfLines={1}
              >
                {message.createdBy?.name || message.originName || 'Signer'}
              </Text>
              <Text
                className='text-text-secondary flex-none text-xs font-normal'
                numberOfLines={1}
              >
                • {DateTime.fromISO(message.createdAt).toRelative()}
              </Text>
            </View>
            {message.description ? (
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {message.description}
              </Text>
            ) : (
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {message.message}
              </Text>
            )}
          </View>
        </View>

        <View className='bg-failure/10 flex flex-none flex-row items-center space-x-1 rounded-md px-2 py-1'>
          <Text className='text-failure inline-flex items-center text-xs font-medium'>
            Sign
          </Text>
          <FontAwesomeIcon
            icon={faAngleRight}
            size={adjust(10, 2)}
            className='text-failure'
          />
        </View>
      </View>
    </BaseButton>
  );
}
