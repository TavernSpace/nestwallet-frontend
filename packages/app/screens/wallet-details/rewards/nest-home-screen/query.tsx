import { useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { isNil } from 'lodash';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { Portal } from 'react-native-paper';
import { NestHome } from '.';
import { useEffectOnSuccess } from '../../../../common/hooks/loading';
import {
  useMutationEmitter,
  useQueryRefetcher,
} from '../../../../common/hooks/query';
import { VoidPromiseFunction } from '../../../../common/types';
import {
  loadDataFromQuery,
  useLoadDataFromQuery,
} from '../../../../common/utils/query';
import {
  levelInfoQueryKey,
  questsQueryKey,
} from '../../../../features/quest/query';
import {
  ILevelInfo,
  IQuest,
  IQuestEventInfo,
  IQuestGroupIdentifier,
  IQuestIdentifier,
  IReferral,
  IUser,
  useClaimQuestRewardsMutation,
  useLevelInfoQuery,
  useQuestEventInfoQuery,
  useQuestsQuery,
  useReferralsQuery,
} from '../../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../../graphql/types';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { LevelUpScreen } from './level-up-screen';

interface NestHomeWithQueryProps {
  user: IUser;
  version: string;
  refetchUser: VoidPromiseFunction;
  onQuestAction: (questID: IQuestIdentifier) => void;
  onQuestGroupAction: (groupID: IQuestGroupIdentifier) => void;
  onNavigateRewards: VoidFunction;
  onNavigateReferral: VoidFunction;
}

export function NestHomeWithQuery(props: NestHomeWithQueryProps) {
  const {
    user,
    version,
    refetchUser,
    onQuestAction,
    onQuestGroupAction,
    onNavigateRewards,
    onNavigateReferral,
  } = props;
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [isShowing, setIsShowing] = useState(false);
  const [level, setLevel] = useState<number>();

  const claimQuestRewardsMutation = useMutationEmitter(
    graphqlType.Quests,
    useClaimQuestRewardsMutation(),
  );

  const levelInfoQuery = useQueryRefetcher(
    graphqlType.Quests,
    useLevelInfoQuery(undefined, { staleTime: 1000 * 10 }),
  );
  const levelInfo = loadDataFromQuery(
    levelInfoQuery,
    (data) => data.levelInfo as ILevelInfo,
  );

  const questsQuery = useQueryRefetcher(
    [graphqlType.Quests],
    useQuestsQuery(
      {
        filter: {
          os: Platform.OS,
          version: version,
        },
      },
      { staleTime: 1000 * 10 },
    ),
  );
  const quests = useLoadDataFromQuery(
    questsQuery,
    (data) => data.quests as IQuest[],
  );

  const eventInfoQuery = useQueryRefetcher(
    [graphqlType.Quests],
    useQuestEventInfoQuery(
      {
        filter: {
          os: Platform.OS,
          version: version,
        },
      },
      { staleTime: 1000 * 5 * 60 },
    ),
  );
  const eventInfo = useLoadDataFromQuery(
    eventInfoQuery,
    (data) => data.questEventInfo as IQuestEventInfo[],
  );

  const referralsQuery = useReferralsQuery();
  const referrals = loadDataFromQuery(
    referralsQuery,
    (data) => data.referrals as IReferral[],
  );

  //TODO: To re-enable rewards, also query lootboxes and lootbox rewards

  // const rewardsQuery = useQueryRefetcher(
  //   [graphqlType.Rewards],
  //   useLootboxRewardsQuery(),
  // );
  // const allRewards = loadDataFromQuery(
  //   rewardsQuery,
  //   (data) => data.lootboxRewards as ILootboxReward[],
  // );

  // const rewards = mapLoadable(allRewards)((rewards) => {
  //   const claimed = rewards.filter(
  //     (reward) => reward.status === ILootboxRewardStatus.Claimed,
  //   );

  //   const distributed = rewards.filter(
  //     (reward) => reward.status === ILootboxRewardStatus.Distributed,
  //   );

  //   return {
  //     claimed: groupRewards(claimed),
  //     distributed: groupRewards(distributed),
  //   } as IGroupedRewards;
  // });

  // const lootboxesQuery = useQueryRefetcher(
  //   [graphqlType.Rewards, graphqlType.PendingTransaction],
  //   useLootboxesQuery(),
  // );
  // const lootboxes = loadDataFromQuery(
  //   lootboxesQuery,
  //   (data) => data.lootboxes as ILootbox[],
  // );

  const onRefreshQuest = async () => {
    await questsQuery.refetch();
    await levelInfoQuery.refetch();
  };

  useEffectOnSuccess(levelInfo, (levelInfo) => {
    const currentLevel = levelInfo.level;
    const currentLevelSeen = levelInfo.levelSeen;
    if (
      !isNil(currentLevel) &&
      !isNil(currentLevelSeen) &&
      currentLevel > currentLevelSeen
    ) {
      showLevelUp({ level: currentLevel });
    }
  });

  // We invalidate level info and quests every time quest screen is focused
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: questsQueryKey({ os: Platform.OS, version: version }),
        stale: true,
      });
      queryClient.invalidateQueries({
        queryKey: levelInfoQueryKey(),
        stale: true,
      });
    }, [queryClient]),
  );

  const showLevelUp = (props: { level: number }) => {
    const { level } = props;
    if (!isNil(level)) {
      setLevel(level);
    }
    setIsShowing(true);
  };

  const handleClaimQuest = async (id: IQuestIdentifier) => {
    try {
      await claimQuestRewardsMutation.mutateAsync({
        input: {
          questId: id,
        },
      });
      await refetchUser();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Failed to complete quest',
      });
    }
  };

  return (
    <>
      <NestHome
        user={user}
        quests={quests}
        referrals={referrals}
        eventInfo={eventInfo}
        levelInfo={levelInfo}
        onRefreshQuest={onRefreshQuest}
        onClaimQuest={handleClaimQuest}
        onQuestAction={onQuestAction}
        onQuestGroupAction={onQuestGroupAction}
        onNavigateRewards={onNavigateRewards}
        onNavigateReferral={onNavigateReferral}
      />

      {isShowing && !isNil(level) && (
        <Portal>
          <LevelUpScreen
            level={level}
            onDismiss={() => {
              setIsShowing(false);
            }}
          />
        </Portal>
      )}
    </>
  );
}
