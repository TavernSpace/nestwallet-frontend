import { withSize } from '../../common/utils/style';
import { View } from '../view';

export function ScanBorder(props: {
  size: number;
  length: number;
  thickness: number;
  color: string;
  radius: number;
}) {
  const { size, length, thickness, color, radius } = props;
  return (
    <View className='absolute' style={withSize(size)}>
      <View
        style={{
          position: 'absolute',
          height: length,
          width: length,
          top: 0,
          left: 0,
          borderColor: color,
          borderTopWidth: thickness,
          borderLeftWidth: thickness,
          borderTopLeftRadius: radius,
        }}
      />
      <View
        style={{
          position: 'absolute',
          height: length,
          width: length,
          top: 0,
          right: 0,
          borderColor: color,
          borderTopWidth: thickness,
          borderRightWidth: thickness,
          borderTopRightRadius: radius,
        }}
      />
      <View
        style={{
          position: 'absolute',
          height: length,
          width: length,
          bottom: 0,
          left: 0,
          borderColor: color,
          borderBottomWidth: thickness,
          borderLeftWidth: thickness,
          borderBottomLeftRadius: radius,
        }}
      />
      <View
        style={{
          position: 'absolute',
          height: length,
          width: length,
          bottom: 0,
          right: 0,
          borderColor: color,
          borderBottomWidth: thickness,
          borderRightWidth: thickness,
          borderBottomRightRadius: radius,
        }}
      />
    </View>
  );
}
