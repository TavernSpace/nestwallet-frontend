import { empty } from '@nestwallet/app/common/utils/functions';
import { PrivateScreen } from '@nestwallet/app/screens/auth/private/screen';
import messaging from '@react-native-firebase/messaging';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';
import { useLoginNavigate } from '../utils';

type RouteProps = StackScreenProps<AuthStackParamList, 'private'>;

export const PrivateWithData = withLoadedLanguage(_PrivateWithData);

// TODO: need to redirect from this page if already logged in
export function _PrivateWithData({ route }: RouteProps) {
  const { generateToken } = useAuthContext();
  const { navigate } = useLoginNavigate();

  const handleGenerateToken = async (name: string) => {
    await messaging().registerDeviceForRemoteMessages().catch(empty);
    const deviceId = await messaging().getToken().catch(empty);
    await generateToken({
      deviceId,
      isMobile: true,
      name,
    });
    await navigate();
  };

  return <PrivateScreen onGenerateToken={handleGenerateToken} />;
}
