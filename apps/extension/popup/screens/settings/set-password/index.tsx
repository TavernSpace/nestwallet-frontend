import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { ChoosePasswordScreen } from '@nestwallet/app/screens/lock/choose-password';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'setNewPassword'>;

export const SetPassword = withUserContext(_SetPassword);

function _SetPassword({ navigation, route }: RouteProps) {
  const { reset } = route.params;
  const { refetchSigners } = useUserContext();
  const { changePassword } = useLockContext();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (newPassword: string) => {
    await changePassword(newPassword, reset);
    // Note: need to show snackbar before navigating
    showSnackbar({
      severity: ShowSnackbarSeverity.success,
      message: 'Successfully changed password!',
    });
    await refetchSigners();
    navigation.getParent()?.goBack();
  };

  return <ChoosePasswordScreen onSubmit={handleSubmit} paddingTop={0} />;
}
