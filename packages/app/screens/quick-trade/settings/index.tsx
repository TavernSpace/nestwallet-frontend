import { faGear } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { memo } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';

export const SettingsButton = memo(
  styled(function (props: {
    onPress: VoidFunction;
    style?: StyleProp<ViewStyle>;
  }) {
    const { onPress, style } = props;

    return (
      <BaseButton onPress={onPress} style={style}>
        <View className='bg-card-highlight h-12 w-12 items-center justify-center rounded-2xl'>
          <FontAwesomeIcon
            icon={faGear}
            size={adjust(20, 2)}
            color={colors.textSecondary}
          />
        </View>
      </BaseButton>
    );
  }),
);
