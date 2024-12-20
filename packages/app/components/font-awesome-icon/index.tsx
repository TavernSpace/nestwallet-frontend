import {
  Props,
  FontAwesomeIcon as RNFontAwesomeIcon,
} from '@fortawesome/react-native-fontawesome';
import { styled } from 'nativewind';

const StyledFontAwesomeIcon = styled(RNFontAwesomeIcon);

export const FontAwesomeIcon = styled(function (props: Props) {
  return <StyledFontAwesomeIcon className='outline-none' {...props} />;
});
