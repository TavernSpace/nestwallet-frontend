import { UpdateEmailScreen } from '@nestwallet/app/screens/settings/update-email';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'updateEmail'>;

export const UpdateEmailWithData = withUserContext(_UpdateEmailWithData);

function _UpdateEmailWithData({ navigation }: RouteProps) {
  const { user } = useUserContext();

  const handleSubmit = (email: string) => {
    navigation.navigate('updateEmailCode', { email });
  };

  return <UpdateEmailScreen user={user} onSubmit={handleSubmit} />;
}
