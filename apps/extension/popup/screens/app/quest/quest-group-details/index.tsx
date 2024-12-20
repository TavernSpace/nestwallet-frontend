import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import {
  IQuest,
  useClaimQuestRewardsMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { QuestGroupDetailsWithQuery } from '@nestwallet/app/screens/quest-group-details/query';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'questGroupDetails'>;

export const QuestGroupDetailsWithData = withUserContext(
  _QuestGroupDetailsWithData,
);

function _QuestGroupDetailsWithData({ route, navigation }: RouteProps) {
  const { groupID } = route.params;

  const claimQuestRewardsMutation = useMutationEmitter(
    graphqlType.Quests,
    useClaimQuestRewardsMutation(),
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleClaim = async (quest: IQuest) => {
    await claimQuestRewardsMutation.mutateAsync({
      input: {
        questId: quest.id,
      },
    });
  };

  return (
    <QuestGroupDetailsWithQuery
      groupID={groupID}
      version={chrome.runtime.getManifest().version}
      onBack={handleBack}
      onClaim={handleClaim}
    />
  );
}
