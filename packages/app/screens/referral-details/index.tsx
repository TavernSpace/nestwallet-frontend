import cn from 'classnames';
import { styled } from 'nativewind';
import { useMemo, useState } from 'react';
import {
  ImageSourcePropType,
  RefreshControl,
  StyleProp,
  ViewStyle,
} from 'react-native';
import XP from '../../assets/images/xp.svg';
import { formatNumber } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { Loadable } from '../../common/types';
import {
  mapLoadable,
  onLoadable,
  spreadLoadable,
} from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { CardErrorState } from '../../components/card/card-empty-state';
import { FlatList } from '../../components/flashlist/flat-list';
import { ActionSheet } from '../../components/sheet';
import { QuestListItemSkeleton } from '../../components/skeleton/list-item';
import { Svg } from '../../components/svg';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { parseError } from '../../features/errors';
import { refreshHapticAsync } from '../../features/haptic';
import { useSafeAreaInsets } from '../../features/safe-area';
import { IReferral } from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { walletDetailBottomTabOffset } from '../wallet-details/navigation/tab-bar-floating';
import { EnterCodeContent } from '../wallet-details/rewards/referral-section/content';
import { ReferralUserItem } from '../wallet-details/rewards/referral-section/referrer-card';
import { ReferralRewardsCard } from '../wallet-details/rewards/referral-section/rewards-summary-card';
import { localization } from './localization';
import { calculateTotals } from './utils';

interface ReferralDetailsScreenProps {
  referrals: Loadable<IReferral[]>;
  onRefresh: () => Promise<void>;
  onSetReferrer: (referralCode: string) => Promise<void>;
}

export function ReferralDetailsScreen(props: ReferralDetailsScreenProps) {
  const { referrals, onRefresh, onSetReferrer } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();
  const inset = useSafeAreaInsets();

  const [selectedRewardType, setSelectedRewardType] = useState<
    'xp' | 'evm' | 'svm'
  >('xp');
  const [refreshing, setRefreshing] = useState(false);
  const [referralLoading, setReferralLoading] = useState(false);
  const [showEnterCodeSheet, setShowEnterCodeSheet] = useState(false);

  const handleRefresh = async () => {
    if (refreshing) return;
    try {
      setRefreshing(true);
      await onRefresh();
      refreshHapticAsync();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.failedToRefreshReferrals[language],
      });
    }
    setRefreshing(false);
  };

  const handleReferral = async (referralCode: string) => {
    try {
      setReferralLoading(true);
      await onSetReferrer(referralCode);
      setShowEnterCodeSheet(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.referralCodeAdded[language],
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setReferralLoading(false);
    }
  };

  const sortedReferrals = useMemo(
    () =>
      mapLoadable(referrals)((referrals) => {
        return referrals.sort((a, b) => {
          switch (selectedRewardType) {
            case 'evm':
              return (
                (b.referralRewards.estimatedEvmEarningsUsd ?? 0) -
                (a.referralRewards.estimatedEvmEarningsUsd ?? 0)
              );
            case 'svm':
              return (
                (b.referralRewards.estimatedSvmEarningsUsd ?? 0) -
                (a.referralRewards.estimatedSvmEarningsUsd ?? 0)
              );
            default:
              return b.pointsEarned - a.pointsEarned;
          }
        });
      }),
    [...spreadLoadable(referrals), selectedRewardType],
  );

  const ListHeader = (props: {
    totalReferrals: number;
    totalXp: number;
    totalEvmEarnings: number;
    totalSvmEarnings: number;
  }) => (
    <View className='flex flex-col space-y-4 px-4 py-2'>
      <ReferralRewardsCard
        totalReferrals={props.totalReferrals}
        totalXp={props.totalXp}
        estimatedEarningsEvm={props.totalEvmEarnings}
        estimatedEarningsSvm={props.totalSvmEarnings}
      />
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-row space-x-2'>
          <Text className='text-text-primary text-lg font-bold'>
            {localization.referrals[language]}
          </Text>
        </View>

        <View className='flex flex-row items-center space-x-2'>
          <SvgButton
            source={XP}
            width={adjust(20, 2)}
            height={adjust(16, 2)}
            isSelected={selectedRewardType === 'xp'}
            onPress={() => setSelectedRewardType('xp')}
          />
          <SvgButton
            source={{
              uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ethereum.svg',
            }}
            width={adjust(28, 2)}
            height={adjust(28, 2)}
            isSelected={selectedRewardType === 'evm'}
            onPress={() => setSelectedRewardType('evm')}
          />
          <SvgButton
            source={{
              uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg',
            }}
            width={adjust(28, 2)}
            height={adjust(28, 2)}
            isSelected={selectedRewardType === 'svm'}
            onPress={() => setSelectedRewardType('svm')}
          />
        </View>
      </View>
    </View>
  );

  const renderItem = useMemo(
    () =>
      ({ item }: { item: IReferral }) => {
        let data: string;
        switch (selectedRewardType) {
          case 'evm':
            data = `${formatNumber({
              input: item.referralRewards.estimatedEvmEarnings ?? 0,
              type: NumberType.TokenNonTx,
            })} ETH`;
            break;
          case 'svm':
            data = `${formatNumber({
              input: item.referralRewards.estimatedSvmEarnings ?? 0,
              type: NumberType.TokenNonTx,
            })} SOL`;
            break;
          default:
            data = `${item.pointsEarned} XP`;
        }

        return (
          <ReferralUserItem
            user={item}
            userName={item.name}
            address={item.address}
            data={data}
          />
        );
      },
    [selectedRewardType],
  );

  const EmptyState = () => (
    <View className='flex flex-col'>
      <QuestListItemSkeleton fixed />
      <QuestListItemSkeleton fixed />
      <View className='flex items-center justify-center pt-4'>
        <Text className='text-text-primary text-base font-medium'>
          {localization.noReferralsYet[language]}
        </Text>
        <Text className='text-text-secondary text-xs font-normal'>
          {localization.inviteFriends[language]}
        </Text>
      </View>
    </View>
  );

  return onLoadable(sortedReferrals)(
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton />
        <QuestListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton />
        <QuestListItemSkeleton />
        <View className='-mt-4 items-center justify-center'>
          <CardErrorState
            title={localization.unableToGetReferrals[language]}
            description={localization.unableToGetReferralsDescription[language]}
          />
        </View>
      </View>
    ),
    (sortedReferrals) => {
      const { totalXp, totalEvmEarnings, totalSvmEarnings } =
        calculateTotals(sortedReferrals);

      return (
        <View className='absolute h-full w-full'>
          <ListHeader
            totalReferrals={sortedReferrals.length}
            totalXp={totalXp}
            totalEvmEarnings={totalEvmEarnings}
            totalSvmEarnings={totalSvmEarnings}
          />
          {sortedReferrals.length === 0 ? (
            <EmptyState />
          ) : (
            <View className='flex-1 px-4 pt-2'>
              <FlatList
                key={selectedRewardType}
                data={sortedReferrals}
                keyExtractor={(item) => item.referralCode}
                estimatedItemSize={adjust(30)}
                ItemSeparatorComponent={() => <View className='h-4' />}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingBottom: inset.bottom + walletDetailBottomTabOffset,
                }}
                refreshControl={
                  <RefreshControl
                    colors={[colors.primary]}
                    progressBackgroundColor={colors.cardHighlight}
                    tintColor={colors.primary}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                  />
                }
              />
            </View>
          )}

          <ActionSheet
            isShowing={showEnterCodeSheet}
            isDetached={true}
            onClose={() => setShowEnterCodeSheet(false)}
          >
            <EnterCodeContent
              loading={referralLoading}
              onClose={() => setShowEnterCodeSheet(false)}
              onConfirm={(code) => handleReferral(code)}
            />
          </ActionSheet>
        </View>
      );
    },
  );
}

interface SvgButtonProps {
  source:
    | ImageSourcePropType
    | React.ComponentType<{ height: number; width: number }>;
  width: number;
  height: number;
  isSelected: boolean;
  style?: StyleProp<ViewStyle>;
  onPress: VoidFunction;
}

const SvgButton = styled(function (props: SvgButtonProps) {
  const { source, width, height, isSelected, style, onPress } = props;

  return (
    <View
      className={cn(
        'bg-card flex h-7 w-12 items-center justify-center rounded-full',
        { 'border-card-highlight-secondary border': isSelected },
      )}
      style={style}
    >
      <BaseButton onPress={onPress}>
        <Svg source={source} width={width} height={height} />
      </BaseButton>
    </View>
  );
});
