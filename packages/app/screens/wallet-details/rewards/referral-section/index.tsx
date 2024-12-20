import { useState } from 'react';
import { Linking, Platform, Share } from 'react-native';
import { useCopy } from '../../../../common/hooks/copy';
import { Loadable } from '../../../../common/types';
import { onLoadable } from '../../../../common/utils/query';
import { adjust } from '../../../../common/utils/style';
import { CardErrorState } from '../../../../components/card/card-empty-state';
import { Image } from '../../../../components/image';
import { ScrollView } from '../../../../components/scroll';
import { ActionSheet } from '../../../../components/sheet';
import { QuestListItemSkeleton } from '../../../../components/skeleton/list-item';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { parseError } from '../../../../features/errors';
import { IReferral, IUser } from '../../../../graphql/client/generated/graphql';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { calculateTotals } from '../../../referral-details/utils';
import { EnterCodeContent } from './content';
import { InviteCard } from './invite';
import { ReferrerCard } from './referrer-card';
import { ReferralRewardsCard } from './rewards-summary-card';
import { ShareOptions } from './share-item';
import { getReferralLink } from './utils';

interface ReferralSectionScreenProps {
  user: IUser;
  referrals: Loadable<IReferral[]>;
  onSetReferrer: (referralCode: string) => Promise<void>;
  onEditReferralCode: () => void;
  onMoreDetailsAction: () => void;
}

export function ReferralSectionScreen(props: ReferralSectionScreenProps) {
  const {
    user,
    referrals,
    onSetReferrer,
    onEditReferralCode,
    onMoreDetailsAction,
  } = props;
  const { showSnackbar } = useSnackbar();

  const [referralLoading, setReferralLoading] = useState(false);
  const [showEnterCodeSheet, setShowEnterCodeSheet] = useState(false);

  const { copy: copyCode } = useCopy('Copied referral code!');
  const { copy: copyLink } = useCopy('Copied referral link!');

  const isMobile = Platform.OS !== 'web';
  const referralLink = getReferralLink(user);

  const message = `Maximize Your Trades! Zero Fees & Earn 20% bonus XP on Nest Wallet: ${referralLink}`;
  const encodedMessage = encodeURIComponent(message);
  const encodedURL = encodeURIComponent(referralLink);

  const sharingOptions: ShareOptions = {
    copy: referralLink,
    telegram: `https://t.me/share/url?url=${encodedURL}&text=${encodeURIComponent(
      'Maximize Your Trades! Zero Fees & Earn 20% bonus XP on Nest Wallet',
    )}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}`,
  };

  const handleRedirect = async (option: keyof ShareOptions) => {
    try {
      const url = sharingOptions[option];
      if (option === 'copy' && isMobile) {
        await Share.share({
          message: message,
          url: referralLink,
          title: 'A Wallet Engineered for Traders',
        });
      } else if (option === 'copy' && !isMobile) {
        copyLink(referralLink);
      } else {
        Linking.openURL(url);
      }
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const handleReferral = async (referralCode: string) => {
    try {
      setReferralLoading(true);
      await onSetReferrer(referralCode);
      setShowEnterCodeSheet(false);
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: 'Referral code added!',
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

  const handleCopyCode = () => copyCode(user.referralCode!);
  const handleCopyLink = () => copyLink(referralLink);

  return onLoadable(referrals)(
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton />
        <QuestListItemSkeleton />
      </View>
    ),
    () => (
      <View className='flex flex-col'>
        <QuestListItemSkeleton fixed />
        <QuestListItemSkeleton fixed />
        <View className='-mt-4 items-center justify-center'>
          <CardErrorState
            title='Unable to get Referrals'
            description='Something went wrong trying to get your referrals.'
          />
        </View>
      </View>
    ),
    (referrals) => {
      const { totalXp, totalEvmEarnings, totalSvmEarnings } =
        calculateTotals(referrals);

      return (
        <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
          <ScrollView
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
          >
            <View className='flex h-full w-full flex-1 flex-col justify-start space-y-6 px-4'>
              <View className='absolute mt-5 opacity-60'>
                <Image
                  source={{
                    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/logo-background.png',
                  }}
                  style={{ height: adjust(232, 4), width: adjust(206, 4) }}
                />
              </View>

              <View className='w-full'>
                <Text className='text-text-primary text-3xl font-bold'>
                  Invite Friends and Earn Rewards Together
                </Text>

                <View className='flex flex-row justify-between pt-2'>
                  <Text className='text-text-secondary flex-1 text-base font-medium'>
                    Invite your friends to the Nest Wallet community and get
                    rewarded!
                  </Text>
                  <View style={{ width: adjust(160, 4) }} />
                </View>
              </View>

              <ReferralRewardsCard
                totalReferrals={referrals.length}
                totalXp={totalXp}
                estimatedEarningsEvm={totalEvmEarnings}
                estimatedEarningsSvm={totalSvmEarnings}
                onMoreDetailsAction={onMoreDetailsAction}
              />
              <InviteCard
                user={user}
                onCopyCode={handleCopyCode}
                onCopyLink={handleCopyLink}
                handleRedirect={handleRedirect}
                onEditReferralCode={onEditReferralCode}
              />
              <ReferrerCard
                user={user}
                onAddReferrerPressed={() => setShowEnterCodeSheet(true)}
              />
              <View className='absolute right-4 top-20'>
                <Image
                  source={{
                    uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/referral-chest.png',
                  }}
                  style={{ height: adjust(120, 4), width: adjust(160, 4) }}
                />
              </View>

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
          </ScrollView>
        </ViewWithInset>
      );
    },
  );
}
