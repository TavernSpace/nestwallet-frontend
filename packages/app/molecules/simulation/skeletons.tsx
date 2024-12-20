import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faCheck,
  faEmptySet,
  faQuestion,
  faTimes,
} from '@fortawesome/pro-regular-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';

export const SimulationSectionSkeleton = () => {
  return (
    <View className='bg-card flex flex-col rounded-xl py-2'>
      <SimulationListItemSkeleton />
      <SimulationListItemSkeleton />
    </View>
  );
};

export function SimulationListItemSkeleton() {
  const size = adjust(24);
  return (
    <View className='flex flex-row items-center justify-between space-x-2 space-y-2 py-2'>
      <View className='flex flex-1 flex-row items-center space-x-4 overflow-hidden'>
        <Skeleton width={size} height={size} borderRadius={9999} />
        <View className='flex-1 space-y-1 pr-4'>
          <Skeleton width={70} height={12} borderRadius={4} />
          <Skeleton width={40} height={10} borderRadius={4} />
        </View>
      </View>
      <View className='flex-shrink-0 flex-col items-end space-y-1 text-right'>
        <Skeleton width={70} height={12} borderRadius={4} />
        <Skeleton width={50} height={10} borderRadius={4} />
      </View>
    </View>
  );
}

export function SimulationSectionError(props: {
  type: 'message' | 'transaction' | 'unsupported_safe' | 'unsupported';
}) {
  const { type } = props;
  return (
    <GenericSimulationInfo
      title='Simulation Unavailable'
      body={
        type === 'message'
          ? 'An error occurred validating this message.'
          : type === 'transaction'
          ? 'An error occurred simulating your transaction.'
          : type === 'unsupported_safe'
          ? 'Transaction simulation currently not supported for Safe on this chain.'
          : 'Transaction simulation currently not supported on this chain.'
      }
      icon={faQuestion}
      iconColor={colors.textPrimary}
      iconBackgroundColor={colors.cardHighlightSecondary}
      size='large'
    />
  );
}

export function SimulationSectionComplete() {
  return (
    <GenericSimulationInfo
      title='Transaction Executed'
      body='This transaction has been successfully confirmed on chain.'
      icon={faCheck}
      iconColor={colors.success}
      iconBackgroundColor={opacity(colors.success, 10)}
      size='large'
    />
  );
}

export function SimulationSectionReplaced() {
  return (
    <GenericSimulationInfo
      title='Transaction Replaced'
      body='Another transaction with the same nonce has been executed.'
      icon={faTimes}
      iconColor={colors.failure}
      iconBackgroundColor={opacity(colors.failure, 10)}
      size='large'
    />
  );
}

export function SimulationSectionEmpty() {
  return (
    <GenericSimulationInfo
      title='No Changed Detected'
      body='No balance changes to your wallet were detected for this transaction.'
      icon={faEmptySet}
      iconColor={colors.textSecondary}
      iconBackgroundColor={colors.cardHighlightSecondary}
      size='large'
    />
  );
}

export const GenericSimulationInfo = styled(function (props: {
  title: string;
  body: string;
  icon: IconProp;
  iconColor: string;
  iconBackgroundColor: string;
  size?: 'medium' | 'large';
  loading?: boolean;
  truncate?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    title,
    body,
    icon,
    iconColor,
    iconBackgroundColor,
    size = 'medium',
    loading = false,
    truncate = false,
    style,
  } = props;

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-4 py-2'>
        {!loading ? (
          <View
            className='flex flex-row items-center justify-center rounded-full'
            style={{
              ...withSize(adjust(size === 'medium' ? 24 : 32)),
              backgroundColor: iconBackgroundColor,
            }}
          >
            <FontAwesomeIcon
              icon={icon}
              size={adjust(size === 'medium' ? 16 : 20, 2)}
              color={iconColor}
            />
          </View>
        ) : (
          <ActivityIndicator
            size={adjust(size === 'medium' ? 24 : 32)}
            color={iconColor}
          />
        )}
        <View className='flex flex-1 flex-col'>
          <Text
            className={cn('text-text-primary text-xs font-medium', {
              truncate: truncate,
            })}
          >
            {title}
          </Text>
          <Text
            className={cn('text-text-secondary text-xs font-normal', {
              truncate: truncate,
            })}
          >
            {body}
          </Text>
        </View>
      </View>
    </View>
  );
});
