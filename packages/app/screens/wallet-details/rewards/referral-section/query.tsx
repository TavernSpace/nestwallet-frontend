import { ReferralSectionScreen } from '.';
import { useMutationEmitter } from '../../../../common/hooks/query';
import { loadDataFromQuery } from '../../../../common/utils/query';
import {
  IReferral,
  IUser,
  useReferralsQuery,
  useSetReferrerMutation,
  useUpdateReferralCodeMutation,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import { ReferralCodeUpdateScreen } from './edit';

interface ReferralSectionWithQueryProps {
  user: IUser;
  onEditReferralCodePressed: () => void;
  onMoreDetailsAction: () => void;
  onNavigateBack: () => void;
}

export function ReferralSectionWithQuery(props: ReferralSectionWithQueryProps) {
  const {
    user,
    onEditReferralCodePressed,
    onMoreDetailsAction,
    onNavigateBack,
  } = props;

  const updateReferralCodeMutation = useMutationEmitter(
    graphqlType.User,
    useUpdateReferralCodeMutation(),
  );

  const setReferrerMutation = useMutationEmitter(
    graphqlType.User,
    useSetReferrerMutation(),
  );

  const referralsQuery = useReferralsQuery();
  const referrals = loadDataFromQuery(
    referralsQuery,
    (data) => data.referrals as IReferral[],
  );

  const handleUpdateReferralCode = async (referralCode: string) => {
    await updateReferralCodeMutation.mutateAsync({
      input: {
        referralCode,
      },
    });
  };

  const handleSetReferrer = async (referralCode: string) => {
    await setReferrerMutation.mutateAsync({
      input: {
        referralCode,
      },
    });
  };

  return user.referralCode ? (
    <ReferralSectionScreen
      user={user}
      referrals={referrals}
      onSetReferrer={handleSetReferrer}
      onEditReferralCode={onEditReferralCodePressed}
      onMoreDetailsAction={onMoreDetailsAction}
    />
  ) : (
    <ReferralCodeUpdateScreen
      user={user}
      onUpdateReferralCode={handleUpdateReferralCode}
      onCancel={onNavigateBack}
    />
  );
}
