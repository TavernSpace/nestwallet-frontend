import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { ActivityIndicator } from '../activity-indicator';
import { InfoAlert } from '../alert/info';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Text } from '../text';
import { View } from '../view';

export const Banner = styled(function (props: {
  title: string;
  subtitle?: string;
  body?: string;
  color: string;
  borderRadius?: number;
  icon: IconDefinition | 'loading' | { adornment: React.ReactNode };
  onPress?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    title,
    subtitle,
    body,
    color,
    icon,
    onPress,
    borderRadius = 9999,
    style,
  } = props;

  const [showSheet, setShowSheet] = useState(false);

  const size = adjust(20, 2);
  const neutral =
    color === colors.card ||
    color === colors.cardHighlight ||
    color === colors.infoNeutral;
  const primary = neutral ? colors.textSecondary : color;

  return (
    <View style={style}>
      <BaseButton
        onPress={
          onPress ? onPress : body ? () => setShowSheet(true) : undefined
        }
      >
        <View
          className='flex w-full flex-row items-center justify-between px-2 py-1.5'
          style={{
            backgroundColor: neutral ? color : opacity(color, 10),
            borderRadius,
          }}
        >
          <View style={withSize(size)}>
            {typeof icon === 'string' ? (
              <ActivityIndicator size={size} color={primary} />
            ) : 'adornment' in icon ? (
              icon.adornment
            ) : (
              <FontAwesomeIcon icon={icon} color={primary} size={size} />
            )}
          </View>
          <Text
            className='truncate text-sm font-medium'
            style={{ color: primary }}
          >
            {title}
          </Text>
          <View style={withSize(size)} />
        </View>
      </BaseButton>
      {!onPress && body ? (
        <InfoAlert
          title={subtitle ?? title}
          body={body}
          onClose={() => setShowSheet(false)}
          isVisible={showSheet}
        />
      ) : null}
    </View>
  );
});
