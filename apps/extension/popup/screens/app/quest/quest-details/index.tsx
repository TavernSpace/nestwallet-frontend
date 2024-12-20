import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { questsQueryKey } from '@nestwallet/app/features/quest/query';
import {
  IQuest,
  IQuestLinkType,
  useClaimQuestRewardsMutation,
  useVerifyQuestMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { QuestDetailsWithQuery } from '@nestwallet/app/screens/quest-details/query';
import { useLinkTo } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { QuestStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'questDetails'>;

export const QuestDetailsWithData = withUserContext(_QuestDetailsWithData);

function _QuestDetailsWithData({ route, navigation }: RouteProps) {
  const { walletId, questId } = route.params;
  const queryClient = useQueryClient();
  const linkTo = useLinkTo();

  const verifyQuestMutation = useMutationEmitter(
    graphqlType.Quests,
    useVerifyQuestMutation(),
  );
  const claimQuestRewardsMutation = useMutationEmitter(
    graphqlType.Quests,
    useClaimQuestRewardsMutation(),
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAction = async (quest: IQuest) => {
    if (!quest.link) {
      return;
    } else if (quest.link.type === IQuestLinkType.Internal) {
      const baseUrl = quest.link.link;
      const params = quest.link.params.reduce((acc, cur) => {
        if (cur.value) {
          return `${acc}&${cur.key}=${cur.value}`;
        } else if (cur.type === 'wallet') {
          // TODO: is there anyway to make this type key more generic? Now if we want to add more types
          // we will need to release a new frontend
          return `${acc}&${cur.key}=${walletId}`;
        } else {
          return acc;
        }
      }, '');
      const link =
        quest.link.params.length === 0 ? baseUrl : `${baseUrl}?${params}`;
      linkTo(link);
    } else {
      if (quest.link.canClaimAfterLink) {
        await verifyQuestMutation.mutateAsync({
          input: {
            questId: quest.id,
            subQuestIndex: quest.subQuestIndex + 1,
          },
        });
        queryClient.invalidateQueries({ queryKey: questsQueryKey() });
      }
      Linking.openURL(quest.link.link);
    }
  };

  const handleVerify = async (quest: IQuest) => {
    await verifyQuestMutation.mutateAsync({
      input: {
        questId: quest.id,
        subQuestIndex: quest.subQuestIndex + 1,
      },
    });
  };

  const handleClaim = async (quest: IQuest) => {
    await claimQuestRewardsMutation.mutateAsync({
      input: {
        questId: quest.id,
      },
    });
  };

  return (
    <QuestDetailsWithQuery
      questId={questId}
      version={chrome.runtime.getManifest().version}
      onBack={handleBack}
      onAction={handleAction}
      onClaim={handleClaim}
      onVerify={handleVerify}
    />
  );
}
