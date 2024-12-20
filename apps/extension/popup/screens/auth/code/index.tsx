import {
  GenerateSignInCodeInput,
  SignInInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { CodeScreen } from '@nestwallet/app/screens/auth/code/screen';
import { useLinkTo } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AuthStackParamList, 'code'>;

export const CodeWithData = withLoadedLanguage(_CodeWithData);

// TODO: need to redirect from this page if already logged in
function _CodeWithData({ route }: RouteProps) {
  const { email, redirect } = route.params;
  const { signIn } = useAuthContext();
  const { walletService } = useAppContext();
  const { apiClient } = useNestWallet();
  const resetTo = useResetTo();
  const linkTo = useLinkTo();

  const handleSignIn = async (values: SignInInput) => {
    const deviceId = await walletService.getDeviceId();
    values.deviceId = deviceId;
    values.isMobile = false;
    await signIn(values);
    if (redirect) {
      // we need to use linkTo for this because redirect is of type To
      linkTo(redirect);
    } else {
      resetTo('app', {
        screen: 'walletDetails',
      });
    }
  };

  const handleRefreshSignInCode = async (values: GenerateSignInCodeInput) => {
    await apiClient.generateSigninCode(values);
  };

  return (
    <CodeScreen
      email={email}
      onRefreshSignInCode={handleRefreshSignInCode}
      onSubmit={handleSignIn}
    />
  );
}
