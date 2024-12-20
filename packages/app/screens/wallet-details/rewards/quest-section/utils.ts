import _ from 'lodash';
import { IQuestGroupItem } from '../../../../components/quests/quest-item/quest-group';
import {
  IQuest,
  IQuestIdentifier,
} from '../../../../graphql/client/generated/graphql';

export function getQuestGroupsFromQuests(
  quests: IQuest[],
  hideComplete: boolean,
  filteredQuestIds: IQuestIdentifier[],
): IQuestGroupItem[] {
  const [grouped, notGrouped] = _.partition(
    quests.filter((quest) => !filteredQuestIds.includes(quest.id)),
    (quest) => !!quest.group,
  );

  const groupedQuests = _.chain(grouped)
    .groupBy((quest) => quest.group!.id)
    .toArray()
    .value()
    .filter(
      (group) =>
        !hideComplete ||
        group.some((item) => item.completion < 1 || item.claimableXp > 0),
    );

  const notGroupedQuests = notGrouped.filter(
    (item) =>
      !hideComplete ||
      item.id === IQuestIdentifier.DailyCheckIn ||
      item.completion < 1 ||
      item.claimableXp > 0,
  );

  if (notGroupedQuests.length > 0) {
    groupedQuests.push(notGroupedQuests);
  }

  return groupedQuests
    .map(
      (quests): IQuestGroupItem => ({
        isCollapsed: true,
        group: quests[0]?.group ?? undefined,
        quests: quests.sort((g1, g2) => g2.priority - g1.priority),
      }),
    )
    .sort(
      (g1, g2) =>
        (g2.group?.priority || g2.quests[0]!.priority) -
        (g1.group?.priority || g1.quests[0]!.priority),
    );
}

export function getQuestGroupFromQuests(
  quests: IQuest[],
): IQuestGroupItem | null {
  return {
    isCollapsed: true,
    group: quests[0]?.group ?? undefined,
    quests: quests.sort((g1, g2) => g2.priority - g1.priority),
  };
}
