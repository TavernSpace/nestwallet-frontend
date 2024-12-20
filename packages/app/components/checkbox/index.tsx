import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { ViewProps } from 'react-native';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';

export type CheckboxProps = ViewProps & {
  selected: boolean;
  onPress?: VoidFunction;
};

export const Checkbox = styled(function (props: CheckboxProps) {
  const { selected, onPress, style, ...rest } = props;

  const size = adjust(16);

  return (
    <BaseButton className='overflow-hidden rounded-sm' onPress={onPress}>
      <View
        className={cn('items-center justify-center rounded-sm', {
          'bg-success/10': selected,
          'bg-card-highlight': !selected,
        })}
        style={[style, withSize(size)]}
        {...rest}
      >
        {selected && (
          <FontAwesomeIcon
            icon={faCheck}
            color={colors.success}
            size={adjust(14, 2)}
          />
        )}
      </View>
    </BaseButton>
  );
});
