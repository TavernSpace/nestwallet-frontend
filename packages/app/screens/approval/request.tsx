import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity } from '../../common/utils/functions';
import { adjust } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';

export const RequestBanner = styled(function (props: {
  title: string;
  icon: IconProp;
  loading?: boolean;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, icon, loading, color = colors.approve, style } = props;

  const size = adjust(14, 2);

  return (
    <View style={style}>
      <View
        className='flex flex-row items-center space-x-2 rounded-full px-4 py-2'
        style={{ backgroundColor: opacity(color, 20) }}
      >
        {loading ? (
          <ActivityIndicator size={size} color={color} />
        ) : (
          <FontAwesomeIcon icon={icon} color={color} size={size} />
        )}
        <Text className='text-sm font-medium' style={{ color }}>
          {title}
        </Text>
      </View>
    </View>
  );
});
