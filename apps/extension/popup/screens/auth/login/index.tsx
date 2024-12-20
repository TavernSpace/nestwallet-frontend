import { GenerateSignInCodeInput } from '@nestwallet/app/common/api/nestwallet/types';
import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { parseError } from '@nestwallet/app/features/errors';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { LoginScreen } from '@nestwallet/app/screens/auth/login/screen';
import { useLinkTo, useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AuthStackParamList, 'login'>;

export const LoginWithData = withLoadedLanguage(_LoginWithData);

// TODO: need to redirect from this page if already logged in
function _LoginWithData({ route }: RouteProps) {
  const { redirect } = route.params ?? {};
  const { apiClient } = useNestWallet();
  const { walletService } = useAppContext();
  const { tokenSignIn } = useAuthContext();
  const navigation = useNavigation();
  const resetTo = useResetTo();
  const linkTo = useLinkTo();

  const handleGenerateSignInCode = async (values: GenerateSignInCodeInput) => {
    // TODO: if the user presses back and continues with the same email, should we send a new code or not?
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
        redirect,
      },
    });
  };

  const handlePrivateSignIn = async () => {
    const token = await walletService.getLocalToken();
    if (!token) {
      navigation.navigate('auth', {
        screen: 'private',
        params: {
          redirect,
        },
      });
    } else {
      const deviceId = await walletService.getDeviceId();
      await tokenSignIn({
        token,
        deviceId,
        isMobile: false,
      });
      if (redirect) {
        linkTo(redirect);
      } else {
        resetTo('app', {
          screen: 'walletDetails',
        });
      }
    }
  };

  return (
    <LoginScreen
      onPrivateSignIn={handlePrivateSignIn}
      onGenerateSignInCode={handleGenerateSignInCode}
    />
  );
}
