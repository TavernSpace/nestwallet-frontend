import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { PrivateScreen } from '@nestwallet/app/screens/auth/private/screen';
import { useLinkTo } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useAuthContext } from '../../../provider/auth';
import { withLoadedLanguage } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AuthStackParamList, 'private'>;

export const PrivateWithData = withLoadedLanguage(_PrivateWithData);

// TODO: need to redirect from this page if already logged in
function _PrivateWithData({ route }: RouteProps) {
  const { redirect } = route.params;
  const { generateToken } = useAuthContext();
  const { walletService } = useAppContext();
  const resetTo = useResetTo();
  const linkTo = useLinkTo();

  const handleGenerateToken = async (name: string) => {
    const deviceId = await walletService.getDeviceId();
    await generateToken({
      deviceId,
      isMobile: false,
      name,
    });
    if (redirect) {
      // we need to use linkTo for this because redirect is of type To
      linkTo(redirect);
    } else {
      resetTo('app', {
        screen: 'walletDetails',
      });
    }
  };

  return <PrivateScreen onGenerateToken={handleGenerateToken} />;
}
