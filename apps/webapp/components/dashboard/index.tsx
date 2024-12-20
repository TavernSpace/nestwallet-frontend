import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { loadDataFromQuery } from '@nestwallet/app/common/utils/query';
import {
  IReferral,
  IUser,
  useCurrentUserQuery,
  useReferralsQuery,
  useSetReferrerMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../provider/auth';
import { DashboardScreen } from './screen';

export function DashboardWithQuery(props: { referralCode?: string }) {
  const { referralCode } = props;
  const { isSignedIn } = useAuthContext();
  const router = useRouter();

  // we want to set a referrer before querying for user
  const [isInitialized, setIsInitialized] = useState(
    !referralCode || referralCode === 'undefined',
  );

  // redirect to login page if user is not logged in
  useEffect(() => {
    if (!isSignedIn()) {
      router.push('/login');
    }
  }, [isSignedIn, router]);

  const setReferrerMutation = useMutationEmitter(
    graphqlType.User,
    useSetReferrerMutation(),
  );

  const userQuery = useCurrentUserQuery({}, { enabled: isInitialized });

  const user = loadDataFromQuery(
    userQuery,
    (data) => data.currentUser as IUser,
  );

  const referralsQuery = useReferralsQuery();
  const referrals = loadDataFromQuery(
    referralsQuery,
    (data) => data.referrals as IReferral[],
  );

  const handleSetReferral = async (referralCode: string) => {
    try {
      await setReferrerMutation.mutateAsync({
        input: {
          referralCode,
        },
      });
      await userQuery.refetch();
    } finally {
      setIsInitialized(true);
    }
  };

  return (
    <DashboardScreen
      user={user}
      referralCode={referralCode}
      referrals={referrals}
      onSubmitReferralCode={handleSetReferral}
    />
  );
}
