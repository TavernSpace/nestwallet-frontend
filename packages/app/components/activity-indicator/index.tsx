import {
  ActivityIndicatorProps,
  ActivityIndicator as RNPActivityIndicator,
} from 'react-native-paper';
import { adjust } from '../../common/utils/style';
import { colors } from '../../design/constants';

export function ActivityIndicator(props: ActivityIndicatorProps) {
  const { size, ...rest } = props;

  const normalizedSize =
    size === 'large'
      ? adjust(36)
      : size === 'small'
      ? adjust(20)
      : typeof size === 'number'
      ? size
      : adjust(36);

  return (
    <RNPActivityIndicator
      color={colors.primary}
      size={normalizedSize}
      {...rest}
    />
  );
}
