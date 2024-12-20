import { ReferralDetailsScreen } from '.';
import { useMutationEmitter } from '../../common/hooks/query';
import { loadDataFromQuery } from '../../common/utils/query';
import {
  IReferral,
  useReferralsQuery,
  useSetReferrerMutation,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';

export function ReferralDetailsWithQuery() {
  const setReferrerMutation = useMutationEmitter(
    graphqlType.User,
    useSetReferrerMutation(),
  );

  const referralsQuery = useReferralsQuery();
  const referrals = loadDataFromQuery(
    referralsQuery,
    (data) => data.referrals as IReferral[],
  );

  const handleRefresh = async () => {
    await referralsQuery.refetch();
  };

  const handleSetReferrer = async (referralCode: string) => {
    await setReferrerMutation.mutateAsync({
      input: {
        referralCode,
      },
    });
  };

  return (
    <ReferralDetailsScreen
      referrals={referrals}
      onRefresh={handleRefresh}
      onSetReferrer={handleSetReferrer}
    />
  );
}
