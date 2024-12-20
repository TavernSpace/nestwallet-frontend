import {
  faCircleExclamation,
  faSquareExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { Banner } from '.';
import { colors } from '../../design/constants';

export const WarningBanner = styled(function (props: {
  title: string;
  subtitle?: string;
  body?: string;
  borderRadius?: number;
  onPress?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, subtitle, body, borderRadius = 9999, onPress, style } = props;

  return (
    <Banner
      title={title}
      subtitle={subtitle}
      body={body}
      color={colors.warning}
      borderRadius={borderRadius}
      icon={borderRadius <= 12 ? faSquareExclamation : faCircleExclamation}
      onPress={onPress}
      style={style}
    />
  );
});
