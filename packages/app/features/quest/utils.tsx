import _ from 'lodash';
import { IQuest, IQuestGroup } from '../../graphql/client/generated/graphql';

export function aggregateQuestRewards(quests: IQuest[], group?: IQuestGroup) {
  return _.chain(
    quests
      .flatMap((quest) =>
        quest.additionalRewards.concat(
          quest.subQuests.flatMap((quest) => quest.additionalRewards),
        ),
      )
      .concat(group ? group.additionalRewards : []),
  )
    .groupBy((quest) => quest.name)
    .toArray()
    .value()
    .map((rewards) =>
      rewards.reduce(
        (acc, cur) => {
          acc.amount = acc.amount + cur.amount;
          return acc;
        },
        {
          amount: 0,
          image: rewards[0]!.image,
          name: rewards[0]!.name,
        },
      ),
    );
}
