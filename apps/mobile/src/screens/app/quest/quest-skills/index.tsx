import { SkillsSection } from '@nestwallet/app/screens/wallet-details/rewards/skills-section';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'skills'>;

export const QuestSkillsWithData = withUserContext(_QuestSkillsWithData);

function _QuestSkillsWithData({ route }: RouteProps) {
  return <SkillsSection />;
}
