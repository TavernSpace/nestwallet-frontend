import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { questsQueryKey } from '@nestwallet/app/features/quest/query';
import { getCurrentVersion } from '@nestwallet/app/features/version';
import {
  IQuest,
  IQuestLinkType,
  useClaimQuestRewardsMutation,
  useVerifyQuestMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { QuestDetailsWithQuery } from '@nestwallet/app/screens/quest-details/query';
import { useLinkTo, useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useQueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { useConnectedSiteQuery } from '../../../../hooks/browser';
import { QuestStackParamList } from '../../../../navigation/types';
import { useAppContext } from '../../../../provider/application';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'questDetails'>;

export const QuestDetailsWithData = withUserContext(_QuestDetailsWithData);

function _QuestDetailsWithData({ route, navigation }: RouteProps) {
  const { walletId, questId } = route.params;
  const { connectionService } = useAppContext();
  const queryClient = useQueryClient();
  const rootNavigation = useNavigation();
  const linkTo = useLinkTo();

  const connectedSiteQuery = useConnectedSiteQuery();

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
      if (quest.link.useInternalBrowser) {
        await connectionService.setCurrentSite({
          url: quest.link.link,
          origin: new URL(quest.link.link).origin,
          title: '',
          imageUrl: '',
        });
        await connectedSiteQuery.refetch();
        // TODO: this is a bit sketchy, and the animation is odd
        rootNavigation.navigate('app', {
          screen: 'walletDetails',
          params: {
            screen: 'browser',
          },
        });
      } else {
        Linking.openURL(quest.link.link);
      }
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
      version={getCurrentVersion()}
      onBack={handleBack}
      onAction={handleAction}
      onClaim={handleClaim}
      onVerify={handleVerify}
    />
  );
}
