import { IconDefinition } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { Origin } from '../../common/types';
import { View } from '../../components/view';
import { useNestWallet, WindowType } from '../../provider/nestwallet';
import { OriginSection } from './origin';
import { RequestBanner } from './request';
import { ConnectionType } from './types';

export const RequestHeader = styled(function (props: {
  origin?: Origin;
  icon: IconDefinition;
  text: string;
  connectionType: ConnectionType;
  style?: StyleProp<ViewStyle>;
}) {
  const { origin, icon, text, connectionType, style } = props;
  const { windowType } = useNestWallet();

  return (
    <View className='flex flex-col' style={style}>
      <View
        className='bg-card flex flex-col items-center pb-4'
        style={{ paddingTop: windowType === WindowType.window ? 24 : 48 }}
      >
        <OriginSection origin={origin} />
        <View
          className='mt-3 flex flex-row items-center space-x-3'
          style={{
            alignSelf: 'center',
          }}
        >
          <RequestBanner title={text} icon={icon} />
        </View>
      </View>
      <View className='bg-card-highlight h-[1px] w-full' />
    </View>
  );
});
