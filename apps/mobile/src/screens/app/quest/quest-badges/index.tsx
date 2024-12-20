import { BadgeSection } from '@nestwallet/app/screens/wallet-details/rewards/badge-section';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'badges'>;

export const QuestBadgesWithData = withUserContext(_QuestBadgesWithData);

function _QuestBadgesWithData({ route }: RouteProps) {
  return <BadgeSection />;
}
