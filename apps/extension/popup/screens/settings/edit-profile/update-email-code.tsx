import {
  UpdateEmailCodeInput,
  UpdateEmailVerifyInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { delay } from '@nestwallet/app/common/api/utils';
import { empty } from '@nestwallet/app/common/utils/functions';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { UpdateEmailCodeScreen } from '@nestwallet/app/screens/settings/update-email-code';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAuthContext } from '../../../provider/auth';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'updateEmailCode'>;

export const UpdateEmailCodeWithData = withUserContext(
  _UpdateEmailCodeWithData,
);

function _UpdateEmailCodeWithData({ navigation, route }: RouteProps) {
  const { email } = route.params;
  const { user, refetch } = useUserContext();
  const { apiClient } = useNestWallet();
  const { updateEmail } = useAuthContext();
  const { showSnackbar } = useSnackbar();

  const handleRefreshCode = async (values: UpdateEmailCodeInput) => {
    await apiClient.updateEmailCode(values);
  };

  const handleSubmit = async (values: UpdateEmailVerifyInput) => {
    await updateEmail(values);
    await refetch().catch(empty);
    await delay(100);
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
