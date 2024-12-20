import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { useSetReferrerMutation } from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { ReferrerTakenScreen } from '@nestwallet/app/screens/settings/add-referrer/referrer-taken-state';
import { AddReferrerScreen } from '@nestwallet/app/screens/settings/add-referrer/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'addReferrer'>;

export const AddReferrerWithData = withUserContext(_AddReferrerWithData);

function _AddReferrerWithData({ navigation, route }: RouteProps) {
  const { referralCode } = route.params;
  const { user } = useUserContext();

  const setReferrerMutation = useMutationEmitter(
    graphqlType.User,
    useSetReferrerMutation(),
  );

  const handleNavigation = async () => {
    navigation.pop();
  };

  const handleAddReferrer = async () => {
    await setReferrerMutation.mutateAsync({
      input: {
        referralCode: referralCode,
      },
    });
    handleNavigation();
  };

  return user.referrer ? (
    <ReferrerTakenScreen user={user.referrer} onClose={handleNavigation} />
  ) : (
    <AddReferrerScreen
      referralCode={referralCode}
      onConfirm={handleAddReferrer}
      onSkip={handleNavigation}
    />
  );
}
