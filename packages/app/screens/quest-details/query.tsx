import { DateTime } from 'luxon';
import { useState } from 'react';
import { Platform } from 'react-native';
import { useEffectOnInitialSuccess } from '../../common/hooks/loading';
import { Loadable } from '../../common/types';
import {
  makeLoadable,
  onLoadable,
  useLoadDataFromQuery,
} from '../../common/utils/query';
import { IQuest, useQuestsQuery } from '../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../molecules/error/screen';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';
import { QuestDetails } from './screen';

interface QuestDetailsQueryProps {
  questId: string;
  version: string;
  onBack: VoidFunction;
  onAction: (quest: IQuest) => Promise<void>;
  onVerify: (quest: IQuest) => Promise<void>;
  onClaim: (quest: IQuest) => Promise<void>;
}

export function QuestDetailsWithQuery(props: QuestDetailsQueryProps) {
  const { questId, version, onClaim, ...rest } = props;
  const { language } = useLanguageContext();

  const [cachedQuest, setCachedQuest] = useState<Loadable<IQuest | null>>(
    makeLoadable(null),
  );

  const questsQuery = useQuestsQuery(
    {
      filter: {
        os: Platform.OS,
        version,
      },
    },
    { staleTime: Infinity },
  );
  const quest = useLoadDataFromQuery(
    questsQuery,
    (data) =>
      (data.quests as IQuest[]).find((quest) => quest.id === questId) ?? null,
  );

  useEffectOnInitialSuccess(quest, (questData) => {
    const questEndDuration = questData?.endTime
      ? DateTime.fromISO(questData.endTime).diff(DateTime.now())
      : undefined;

    if (questEndDuration && questEndDuration.toMillis() < 0) {
      setCachedQuest(makeLoadable(questData));
    }
  });

  const handleClaim = async (quest: IQuest) => {
    await onClaim(quest);

    if (cachedQuest.data) {
      setCachedQuest(
        makeLoadable({
          ...cachedQuest.data,
          completion: 1,
          claimableXp: 0,
          subQuestIndex: cachedQuest.data.subQuests.length - 1,
        }),
      );
    }
  };

  const questToDisplay = quest.data ? quest : cachedQuest;

  return onLoadable(questToDisplay)(
    () => null,
    () => (
      <ErrorScreen
        title={localization.unableToGetQuest[language]}
        description={localization.unableToGetQuestDescription[language]}
      />
    ),
    (questToDisplay) =>
      questToDisplay ? (
        <QuestDetails {...rest} quest={questToDisplay} onClaim={handleClaim} />
      ) : (
        <ErrorScreen
          title={localization.questNotFound[language]}
          description={localization.questNotFoundDescription[language]}
        />
      ),
  );
}
