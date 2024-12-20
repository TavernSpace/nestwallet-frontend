import {
  faCircleCheck,
  faCircleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { adjust, withSize } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

export function ExecutionBanner(props: {
  isExecuting: boolean;
  isExecuted: boolean;
  isFailed: boolean;
  isReverted: boolean;
  isDropped: boolean;
  isReplaced: boolean;
}) {
  const {
    isExecuted,
    isExecuting,
    isFailed,
    isReverted,
    isDropped,
    isReplaced,
  } = props;
  const { language } = useLanguageContext();

  if (
    !isExecuted &&
    !isExecuting &&
    !isFailed &&
    !isReverted &&
    !isDropped &&
    !isReplaced
  ) {
    return null;
  }

  const size = adjust(20, 2);

  return (
    <View className='w-full'>
      <View
        className={cn(
          'flex flex-row items-center justify-between rounded-full px-2 py-1.5',
          {
            'bg-success/10': isExecuted,
            'bg-primary/10': !isExecuted && (isExecuting || isReplaced),
            'bg-failure/10':
              !isExecuted &&
              !isExecuting &&
              !isReplaced &&
              (isFailed || isReverted || isDropped),
          },
        )}
      >
        <FontAwesomeIcon
          icon={isExecuted ? faCircleCheck : faCircleExclamation}
          color={
            isExecuted
              ? colors.success
              : isExecuting
              ? colors.primary
              : colors.failure
          }
          size={size}
        />
        <Text
          className={cn('text-center text-sm font-medium', {
            'text-success': isExecuted,
            'text-primary': !isExecuted && (isExecuting || isReplaced),
            'text-failure':
              !isExecuted &&
              !isExecuting &&
              !isReplaced &&
              (isFailed || isReverted || isDropped),
          })}
        >
          {isExecuted
            ? localization.executed[language]
            : isExecuting
            ? localization.executing[language]
            : isFailed
            ? localization.partiallyExecuted[language]
            : isReverted
            ? localization.failed[language]
            : isDropped
            ? localization.dropped[language]
            : localization.replaced[language]}
        </Text>
        <View style={withSize(size)} />
      </View>
    </View>
  );
}
