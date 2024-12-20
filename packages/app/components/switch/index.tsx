import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { Switch as RNSwitch } from 'react-native-paper';
import { opaque } from '../../common/utils/functions';
import { colors } from '../../design/constants';
import { View } from '../view';

export const Switch = styled(function (props: {
  value: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { value, disabled = false, onChange, style } = props;

  return (
    <View style={style}>
      <RNSwitch
        color={
          Platform.OS === 'ios'
            ? opaque(colors.primary, colors.background, 10)
            : colors.primary
        }
        thumbColor={value && Platform.OS !== 'web' ? colors.primary : undefined}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      />
    </View>
  );
});
