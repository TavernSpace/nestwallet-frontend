import { IntroInfoScreen } from '@nestwallet/app/screens/intro/info/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { IntroStackParamList } from '../../../navigation/types';
import { withLoadedLanguage } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<IntroStackParamList, 'introInfo'>;

export const IntroInfo = withLoadedLanguage(_IntroInfo);

function _IntroInfo({ route }: RouteProps) {
  const navigation = useNavigation();

  const handleContinue = () => {
    navigation.navigate('intro', {
      screen: 'introDapp',
    });
  };

  return <IntroInfoScreen onContinue={handleContinue} />;
}
