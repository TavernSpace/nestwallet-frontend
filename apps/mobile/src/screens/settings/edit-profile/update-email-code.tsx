import {
  UpdateEmailCodeInput,
  UpdateEmailVerifyInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { UpdateEmailCodeScreen } from '@nestwallet/app/screens/settings/update-email-code';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAuthContext } from '../../../provider/auth';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'updateEmailCode'
>;

export const UpdateEmailCodeWithData = withUserContext(
  _UpdateEmailCodeWithData,
);

function _UpdateEmailCodeWithData({ route, navigation }: RouteProps) {
  const { email } = route.params;
  const { user } = useUserContext();
  const { apiClient } = useNestWallet();
  const { updateEmail } = useAuthContext();
  const { showSnackbar } = useSnackbar();

  const handleRefreshCode = async (values: UpdateEmailCodeInput) => {
    await apiClient.updateEmailCode(values);
  };

  const handleSubmit = async (values: UpdateEmailVerifyInput) => {
    await updateEmail(values);
    user.email = values.email;
    // Note: need to show snackbar before navigating
    showSnackbar({
      severity: ShowSnackbarSeverity.success,
      message: `Successfully ${user.email ? 'changed' : 'added'} email!`,
    });
    navigation.getParent()?.goBack();
  };

  return (
    <UpdateEmailCodeScreen
      user={user}
      email={email}
      onRefreshCode={handleRefreshCode}
      onSubmit={handleSubmit}
    />
  );
}
