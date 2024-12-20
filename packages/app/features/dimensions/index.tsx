import { Dimensions, Platform } from 'react-native';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../design/constants';
import { useNestWallet, WindowType } from '../../provider/nestwallet';

export function useDimensions() {
  const { windowType } = useNestWallet();

  if (Platform.OS !== 'web' || windowType !== WindowType.sidepanel) {
    return { height: SCREEN_HEIGHT, width: SCREEN_WIDTH };
  } else {
    const dimensions = Dimensions.get('window');
    return { height: dimensions.height, width: dimensions.width };
  }
}
