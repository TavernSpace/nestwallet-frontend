import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { useUpdateReferralCodeMutation } from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { ReferralCodeUpdateScreen } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/edit';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'updateReferralCode'>;

export const UpdateReferralCodeWithData = withUserContext(
  _UpdateReferralCodeWithData,
);

function _UpdateReferralCodeWithData({ navigation }: RouteProps) {
  const { user } = useUserContext();

  const updateReferralCodeMutation = useMutationEmitter(
    graphqlType.User,
    useUpdateReferralCodeMutation(),
  );

  const handleUpdateReferral = async (referralCode: string) => {
    await updateReferralCodeMutation.mutateAsync({
      input: {
        referralCode,
      },
    });
    navigation.goBack();
  };

  return (
    <ReferralCodeUpdateScreen
      user={user}
      onUpdateReferralCode={handleUpdateReferral}
      onCancel={navigation.goBack}
    />
  );
}
