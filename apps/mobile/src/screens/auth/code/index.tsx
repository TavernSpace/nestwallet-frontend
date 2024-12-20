import {
  GenerateSignInCodeInput,
  SignInInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { empty } from '@nestwallet/app/common/utils/functions';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { CodeScreen } from '@nestwallet/app/screens/auth/code/screen';
import messaging from '@react-native-firebase/messaging';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';
import { useLoginNavigate } from '../utils';

type RouteProps = NativeStackScreenProps<AuthStackParamList, 'code'>;

export const CodeWithData = withLoadedLanguage(_CodeWithData);

export function _CodeWithData({ route }: RouteProps) {
  const { email } = route.params;
  const { apiClient } = useNestWallet();
  const { signIn } = useAuthContext();
  const { navigate } = useLoginNavigate();

  const handleSignIn = async (values: SignInInput) => {
    await messaging().registerDeviceForRemoteMessages().catch(empty);
    const deviceId = await messaging().getToken().catch(empty);
    values.deviceId = deviceId;
    values.isMobile = true;
    await signIn(values);
    await navigate();
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
