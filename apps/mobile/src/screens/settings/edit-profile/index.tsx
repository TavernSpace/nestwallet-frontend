import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IUpdateUserProfileInput,
  useUpdateUserProfileMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { sanitizeUpdateUserProfileInput } from '@nestwallet/app/graphql/utils';
import { EditProfileScreen } from '@nestwallet/app/screens/settings/edit-profile/screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<SettingsStackParamList, 'editProfile'>;

export const EditProfileWithData = withUserContext(_EditProfileWithData);

function _EditProfileWithData({ navigation }: RouteProps) {
  const { user } = useUserContext();

  const updateUserProfileMutation = useMutationEmitter(
    graphqlType.User,
    useUpdateUserProfileMutation(),
  );

  const handleUpdateEmail = () => {
    navigation.navigate('updateEmail');
  };

  const handleSubmit = async (value: IUpdateUserProfileInput) => {
    const input = sanitizeUpdateUserProfileInput(value);
    await updateUserProfileMutation.mutateAsync({
      input,
    });
    navigation.goBack();
  };

  return (
    <EditProfileScreen
      user={user}
      onUpdateEmail={handleUpdateEmail}
      onSubmit={handleSubmit}
    />
  );
}
