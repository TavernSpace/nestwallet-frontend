import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  mapLoadable,
  onLoadable,
  useLoadDataFromQuery,
} from '../../common/utils/query';
import { IQuest, useQuestsQuery } from '../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../molecules/error/screen';
import { useLanguageContext } from '../../provider/language';
import { getQuestGroupFromQuests } from '../wallet-details/rewards/quest-section/utils';
import { localization } from './localization';
import { QuestGroupDetails } from './screen';

interface QuestGroupDetailsQueryProps {
  groupID: string;
  version: string;
  onBack: VoidFunction;
  onClaim: (quest: IQuest) => Promise<void>;
}

export function QuestGroupDetailsWithQuery(props: QuestGroupDetailsQueryProps) {
  const { groupID, version, onBack, onClaim } = props;
  const { language } = useLanguageContext();

  const questsQuery = useQuestsQuery(
    {
      filter: {
        os: Platform.OS,
        version,
      },
    },
    { staleTime: Infinity },
  );
  const questsInGroup = useLoadDataFromQuery(questsQuery, (data) =>
    (data.quests as IQuest[]).filter((quest) => quest.group?.id === groupID),
  );

  const questGroup = useMemo(() => {
    return mapLoadable(questsInGroup)((questInGroup) =>
      getQuestGroupFromQuests(questInGroup),
    );
  }, [questsInGroup]);

  return onLoadable(questGroup)(
    () => null,
    () => (
      <ErrorScreen
        title={localization.unableToGetQuestGroup[language]}
        description={localization.unableToGetQuestGroupDescription[language]}
      />
    ),
    (questGroup) =>
      questGroup ? (
        <QuestGroupDetails
          onBack={onBack}
          onClaim={onClaim}
          questGroupItem={questGroup}
        />
      ) : (
        <ErrorScreen
          title={localization.questGroupNotFound[language]}
          description={localization.questGroupNotFoundDescription[language]}
        />
      ),
  );
}
