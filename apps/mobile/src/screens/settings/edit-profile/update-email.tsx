import { UpdateEmailScreen } from '@nestwallet/app/screens/settings/update-email';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<SettingsStackParamList, 'updateEmail'>;

export const UpdateEmailWithData = withUserContext(_UpdateEmailWithData);

function _UpdateEmailWithData({ navigation }: RouteProps) {
  const { user } = useUserContext();

  const handleGenerateCode = async (email: string) => {
    navigation.navigate('updateEmailCode', { email });
  };

  return <UpdateEmailScreen user={user} onSubmit={handleGenerateCode} />;
}
