import { IntroDappScreen } from '@nestwallet/app/screens/intro/dapp/screen';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { IntroStackParamList } from '../../../navigation/types';
import { withLoadedLanguage } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<IntroStackParamList, 'introDapp'>;

export const IntroDapp = withLoadedLanguage(_IntroDapp);

function _IntroDapp({ route }: RouteProps) {
  const navigation = useNavigation();
  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'auth', params: { screen: 'login' } }],
    });
  };

  return <IntroDappScreen onContinue={handleContinue} />;
}
