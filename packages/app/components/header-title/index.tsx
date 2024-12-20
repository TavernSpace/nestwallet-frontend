import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import { ImageSourcePropType } from 'react-native';
import { withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { IconButton } from '../button/icon-button';
import { Svg } from '../svg';
import { Text } from '../text';
import { View } from '../view';

export const HeaderWithTitle = (props: {
  source: ImageSourcePropType;
  title: string;
  width: number;
  height: number;
  onBack: VoidFunction;
}) => {
  const { source, title, width, height, onBack } = props;
  const { top } = useSafeAreaInsets();

  return (
    <View
      className='flex flex-row items-center justify-between px-4'
      style={{ paddingTop: Math.max(top, 14) }}
    >
      <View className='-ml-1'>
        <IconButton
          icon={faChevronLeft}
          size={20}
          onPress={onBack}
          color={colors.textPrimary}
        />
      </View>
      <HeaderTitle
        source={source}
        title={title}
        width={width}
        height={height}
      />
      <View className='-mr-1' style={withSize(30)} />
    </View>
  );
};

export const HeaderTitle = (props: {
  source: ImageSourcePropType;
  title: string;
  width: number;
  height: number;
}) => {
  const { source, title, width, height } = props;
  return (
    <View className='flex-row items-center justify-center space-x-2'>
      <Svg source={source} width={width} height={height} />
      <Text className='text-text-primary text-base font-medium'>{title}</Text>
    </View>
  );
};
