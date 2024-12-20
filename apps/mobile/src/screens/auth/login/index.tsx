import { GenerateSignInCodeInput } from '@nestwallet/app/common/api/nestwallet/types';
import { empty } from '@nestwallet/app/common/utils/functions';
import { parseError } from '@nestwallet/app/features/errors';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { LoginScreen } from '@nestwallet/app/screens/auth/login/screen';
import messaging from '@react-native-firebase/messaging';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';
import { useLoginNavigate } from '../utils';

type RouteProps = NativeStackScreenProps<AuthStackParamList, 'login'>;

export const LoginWithData = withLoadedLanguage(_LoginWithData);

export function _LoginWithData({ route }: RouteProps) {
  const { apiClient } = useNestWallet();
  const { walletService } = useAppContext();
  const { tokenSignIn } = useAuthContext();
  const { navigate } = useLoginNavigate();
  const navigation = useNavigation();

  const handleGenerateSignInCode = async (values: GenerateSignInCodeInput) => {
    await apiClient.generateSigninCode(values).catch((err) => {
      const error = parseError(err);
      if (
        error.message !== 'Too many codes sent, please wait before retrying'
      ) {
        throw err;
      }
    });
    navigation.navigate('auth', {
      screen: 'code',
      params: {
        email: values.email,
      },
    });
  };

  const handlePrivateSignIn = async () => {
    const token = await walletService.getLocalToken();
    if (!token) {
      navigation.navigate('auth', {
        screen: 'private',
      });
    } else {
      await messaging().registerDeviceForRemoteMessages().catch(empty);
      const deviceId = await messaging().getToken().catch(empty);
      await tokenSignIn({
        token,
        deviceId,
        isMobile: true,
      });
      await navigate();
    }
  };

  return (
    <LoginScreen
      onPrivateSignIn={handlePrivateSignIn}
      onGenerateSignInCode={handleGenerateSignInCode}
    />
  );
}
