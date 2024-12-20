import { ChangePasswordScreen } from '@nestwallet/app/screens/settings/change-password/screen';
import { useNavigation } from '@react-navigation/native';
import { useLockContext } from '../../../provider/lock';
import { withUserContext } from '../../../provider/user/wrapper';

export const PasswordChangedWithData = withUserContext(
  _PasswordChangedWithData,
);

export function _PasswordChangedWithData() {
  const { unlock } = useLockContext();
  const navigation = useNavigation();

  const handleConfirmChange = async () => {
    navigation.navigate('app', {
      screen: 'settings',
      params: {
        screen: 'setNewPassword',
        params: {
          reset: false,
        },
      },
    });
  };

  return (
    <ChangePasswordScreen onSubmit={handleConfirmChange} onUnlock={unlock} />
  );
}
