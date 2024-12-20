import { faRefresh } from '@fortawesome/pro-regular-svg-icons';
import { styled } from 'nativewind';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { ActivityIndicator } from '../activity-indicator';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';
import { BaseButton, BaseButtonProps } from './base-button';

export const RefreshButton = styled(function (
  props: Omit<BaseButtonProps, 'children'> & {
    refreshing: boolean;
  },
) {
  const { refreshing, disabled } = props;

  const size = adjust(28);

  return (
    <BaseButton {...props} disabled={refreshing || disabled}>
      <View
        className='bg-card items-center justify-center rounded-md'
        style={withSize(size)}
      >
        {!refreshing ? (
          <FontAwesomeIcon
            icon={faRefresh}
            size={adjust(18, 2)}
            color={colors.textSecondary}
          />
        ) : (
          <ActivityIndicator
            size={adjust(18, 2)}
            color={colors.textSecondary}
          />
        )}
      </View>
    </BaseButton>
  );
});
