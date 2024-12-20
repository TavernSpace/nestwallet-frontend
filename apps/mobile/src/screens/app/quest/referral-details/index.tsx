import { ReferralDetailsWithQuery } from '@nestwallet/app/screens/referral-details/query';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'referralDetails'>;

export const ReferralDetailsWithData = withUserContext(
  _ReferralDetailsWithData,
);

function _ReferralDetailsWithData({ route }: RouteProps) {
  return <ReferralDetailsWithQuery />;
}
