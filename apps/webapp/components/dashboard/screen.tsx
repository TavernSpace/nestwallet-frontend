import {
  faApple,
  faChrome,
  faGooglePlay,
} from '@fortawesome/free-brands-svg-icons';
import {
  faChartLine,
  faCoins,
  faDollarSign,
  faFaceThinking,
} from '@fortawesome/pro-solid-svg-icons';
import NestLogo from '@nestwallet/app/assets/images/logos/nest-logo.svg';
import tradingBg from '@nestwallet/app/assets/videos/dashboard/trading-bg.webm';
import { Loadable } from '@nestwallet/app/common/types';
import { tuple } from '@nestwallet/app/common/utils/functions';
import {
  composeLoadables,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { ActivityIndicator } from '@nestwallet/app/components/activity-indicator';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { TextButton } from '@nestwallet/app/components/button/text-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { RawTextInput } from '@nestwallet/app/components/text-input';
import { colors } from '@nestwallet/app/design/constants';
import { parseError } from '@nestwallet/app/features/errors';
import {
  IReferral,
  IUser,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ShowSnackbarSeverity } from '@nestwallet/app/provider/snackbar';
import { calculateTotals } from '@nestwallet/app/screens/referral-details/utils';
import { InviteCard } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/invite';
import { ReferralUserItem } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/referrer-card';
import { ReferralRewardsCard } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/rewards-summary-card';
import { ShareOptions } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/share-item';
import { getReferralLink } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/utils';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Popup } from '../common/popup';
import {
  appStoreUrl,
  chromeWebStoreUrl,
  googlePlayStoreUrl,
} from '../home/utils';
import { useWebSnackbar } from '../provider/snackbar';

interface DashboardScreenProps {
  user: Loadable<IUser>;
  referralCode: string | undefined;
  referrals: Loadable<IReferral[]>;
  onSubmitReferralCode: (code: string) => Promise<void>;
}
export function DashboardScreen(props: DashboardScreenProps) {
  const { user, referralCode, referrals, onSubmitReferralCode } = props;
  const router = useRouter();
  const { showSnackbar } = useWebSnackbar();

  const [showAddReferrerPopup, setShowAddReferrerPopup] = useState(false);
  const [isSubmittingReferralCode, setIsSubmittingReferralCode] =
    useState(false);

  useEffect(() => {
    handleSetReferral(referralCode);
  }, [referralCode]);

  const handleSetReferral = async (referralCode: string | undefined) => {
    if (!referralCode || referralCode === 'undefined') return;
    setIsSubmittingReferralCode(true);
    try {
      await onSubmitReferralCode(referralCode);
      showSnackbar({
        duration: 6000,
        message: `Referral code ${referralCode} was added successfully!`,
        severity: ShowSnackbarSeverity.success,
      });
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        duration: 4000,
        message: error.message,
        severity: ShowSnackbarSeverity.error,
      });
    } finally {
      setIsSubmittingReferralCode(false);
    }
  };

  return (
    <div className='flex h-full w-full flex-col items-center justify-center space-y-4 overflow-hidden px-10 md:flex-row md:space-x-9'>
      <BaseButton
        className='fixed left-0 top-0'
        onPress={() => router.push('/')}
      >
        <div className='flex flex-row items-center justify-start space-x-2 px-6 py-4'>
          <Image src={NestLogo} style={{ width: 32, height: 32 }} alt={''} />
          <div className='text-text-primary justify-center whitespace-pre text-sm font-bold'>
            {'Nest Wallet'}
          </div>
        </div>
      </BaseButton>

      <div className='flex h-4/5 w-full flex-col items-center justify-center space-y-2 md:w-1/4'>
        <RewardsCard user={user} />
        <RevShareCard />
      </div>

      <DownloadCard />

      <div className='flex h-4/5 w-full flex-col items-center justify-center space-y-2 md:w-1/4'>
        <ReferredByCard
          user={user}
          onPressAddReferrer={() => setShowAddReferrerPopup(true)}
        />
        <ReferralsCard user={user} referrals={referrals} />
      </div>

      <Popup
        isShowing={showAddReferrerPopup}
        onClose={() => setShowAddReferrerPopup(false)}
      >
        <AddReferrer
          loading={isSubmittingReferralCode}
          onSubmitReferralCode={handleSetReferral}
        />
      </Popup>
    </div>
  );
}

function RewardsCard(props: { user: Loadable<IUser> }) {
  const { user } = props;
  return onLoadable(user)(
    () => <ActivityIndicator />,
    () => null,
    (user) => {
      const referrer = user.referrer;
      return (
        <div className='bg-card flex h-1/3 w-full flex-col items-center justify-center rounded-3xl backdrop-blur-sm'>
          <div className='flex h-full w-full flex-col space-y-4 p-10'>
            <div className='text-text-primary text-center text-3xl md:text-left'>
              Rewards
            </div>
            <div className='flex h-full w-full flex-col items-center justify-center space-y-4 text-center'>
              <div className='text-text-secondary text-base font-normal'>
                {referrer
                  ? 'You are now automatically earning'
                  : 'Add a referrer to start earning'}
              </div>
              <div className='bg-card-highlight flex flex-row items-center justify-between space-x-1 rounded-xl px-3 py-1.5'>
                <div className='text-success text-lg font-bold'>20%</div>
                <div className='text-text-primary text-base font-normal'>
                  additional $NEST XP!
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
  );
}

function RevShareCard() {
  return (
    <div className='bg-card flex h-3/4 w-full flex-col items-center justify-center rounded-3xl backdrop-blur-sm'>
      <div className='flex h-full w-full flex-col space-y-8 p-10'>
        <div className='text-text-primary text-center text-3xl md:text-left'>
          Rev Share Program
        </div>
        <div className='flex flex-col space-y-3 text-left'>
          <div className='flex items-center space-x-2'>
            <FontAwesomeIcon
              icon={faDollarSign}
              size={20}
              color={colors.success}
            />
            <div className='text-text-primary text-sm'>
              Earn <span className='text-success font-bold'>10%</span> of fees
              generated by your referrals!
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <FontAwesomeIcon
              icon={faChartLine}
              size={20}
              color={colors.arbitrum}
            />
            <div className='text-text-primary text-sm'>
              Track your earnings on our website dashboard or in-app.
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <FontAwesomeIcon icon={faCoins} size={20} color={colors.primary} />
            <div className='text-text-primary text-sm'>
              Collect and claim <span className='text-primary'> REAL </span>{' '}
              money at the end of each month.
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <FontAwesomeIcon
              icon={faFaceThinking}
              size={20}
              color={colors.buyNft}
            />
            <div className='text-text-primary text-sm'>
              Earn rewards in [
              <span className='text-text-primary text-xss italic'>
                {' '}
                redacted{' '}
              </span>
              ].
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DownloadCard() {
  return (
    <div className='bg-card flex w-full flex-col items-center justify-center rounded-3xl backdrop-blur-sm md:w-1/3'>
      <div className='flex h-full w-full flex-col justify-between p-10'>
        <div className='flex flex-row items-center justify-center space-x-2'>
          <div className='text-text-primary text-center text-3xl'>
            Ready to Start
          </div>
          <div className='text-primary text-center text-3xl'>Trading</div>
          <div className='text-text-primary text-center text-3xl'>?</div>
        </div>
        <video
          src={tradingBg}
          muted={true}
          loop={true}
          autoPlay={true}
          playsInline={true}
        />
        <div className='flex flex-col'>
          <div className='text-text-primary ml-1 text-center text-sm'>
            Trade on-chain with confidence, using extension or mobile
          </div>
          <div className='mt-3 flex w-full flex-row justify-between space-y-4 md:flex-row  md:space-x-4 md:space-y-0'>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(chromeWebStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-4'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faChrome}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>Chrome</div>
              </div>
            </BaseButton>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(appStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-4'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faApple}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>iOS</div>
              </div>
            </BaseButton>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(googlePlayStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-4'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faGooglePlay}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>Android</div>
              </div>
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReferredByCard(props: {
  user: Loadable<IUser>;
  onPressAddReferrer: VoidFunction;
}) {
  const { user, onPressAddReferrer } = props;

  return onLoadable(user)(
    () => <ActivityIndicator />,
    () => null,
    (user) => {
      const referrer = user.referrer;
      return (
        <div className='bg-card flex h-1/3 w-full flex-col items-center justify-center rounded-3xl backdrop-blur-sm'>
          <div className='flex h-full w-full flex-col space-y-3 p-10'>
            <div className='text-text-primary text-left text-3xl'>
              Referred By
            </div>
            {referrer ? (
              <div className='flex h-full w-full flex-col justify-center space-y-2'>
                <div className='bg-card rounded-2xl px-4 py-2'>
                  <ReferralUserItem
                    user={referrer}
                    userName={referrer.name}
                    address={referrer.address}
                    size='large'
                  />
                </div>

                <div className='flex flex-col items-center space-y-2'>
                  <div className='bg-card-highlight flex flex-row items-center justify-between space-x-1 rounded-xl px-3 py-1.5'>
                    <div className='text-text-secondary text-sm font-normal'>
                      {'Code Applied: '}
                    </div>
                    <div className='text-text-primary text-sm font-medium'>
                      {referrer.referralCode}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <BaseButton className='w-fit' onPress={onPressAddReferrer}>
                <div
                  className='border-primary flex items-center justify-center rounded-2xl border'
                  style={{ width: 120, height: 30 }}
                >
                  <div className='text-primary text-xs font-medium'>
                    Add Referrer
                  </div>
                </div>
              </BaseButton>
            )}
          </div>
        </div>
      );
    },
  );
}

function ReferralsCard(props: {
  user: Loadable<IUser>;
  referrals: Loadable<IReferral[]>;
}) {
  const { user, referrals } = props;
  return onLoadable(composeLoadables(user, referrals)(tuple))(
    () => <ActivityIndicator />,
    () => null,
    ([user, referrals]) => {
      const { showSnackbar } = useWebSnackbar();

      const handleCopy = (text: string, message: string) => {
        navigator.clipboard.writeText(text);
        showSnackbar({
          duration: 4000,
          message: message,
          severity: ShowSnackbarSeverity.success,
        });
      };

      const referralLink = getReferralLink(user);

      const message = `Maximize Your Trades! Zero fees & earn 20% bonus $NEST XP on Nest Wallet: ${referralLink}`;
      const encodedMessage = encodeURIComponent(message);
      const encodedURL = encodeURIComponent(referralLink);

      const sharingOptions: ShareOptions = {
        copy: referralLink,
        telegram: `https://t.me/share/url?url=${encodedURL}&text=${encodeURIComponent(
          'Maximize Your Trades! Zero fees & earn 20% bonus $NEST XP on Nest Wallet',
        )}`,
        twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
        whatsapp: `https://api.whatsapp.com/send?text=${encodedMessage}`,
      };

      const handleRedirect = async (option: keyof ShareOptions) => {
        const url = sharingOptions[option];
        if (option === 'copy') {
          handleCopy(referralLink, 'Copied referral link!');
        } else {
          Linking.openURL(url);
        }
      };

      const { totalXp, totalEvmEarnings, totalSvmEarnings } =
        calculateTotals(referrals);

      return (
        <div className='bg-card flex h-3/4 w-full flex-col items-center justify-center rounded-3xl backdrop-blur-sm'>
          <div className='flex h-full w-full flex-col p-10'>
            <div className='text-text-primary text-center text-3xl md:text-left'>
              Rewards
            </div>
            <div>
              <ReferralRewardsCard
                totalReferrals={referrals.length}
                totalXp={totalXp}
                estimatedEarningsEvm={totalEvmEarnings}
                estimatedEarningsSvm={totalSvmEarnings}
              />
            </div>

            <InviteCard
              user={user}
              onCopyCode={() =>
                handleCopy(user.referralCode!, 'Copied referral code!')
              }
              onCopyLink={() =>
                handleCopy(referralLink, 'Copied referral link!')
              }
              handleRedirect={handleRedirect}
            />
          </div>
        </div>
      );
    },
  );
}

function AddReferrer(props: {
  loading: boolean;
  onSubmitReferralCode: (code: string) => void;
}) {
  const { loading, onSubmitReferralCode } = props;
  const [code, setCode] = useState<string>('');

  return (
    <div className='flex h-[300px] w-[450px] flex-col items-center justify-between py-10'>
      <div className='text-text-primary text-2xl'>Add a referral code</div>
      <RawTextInput
        className='text-text-primary bg-card-highlight h-12 w-3/4 rounded-xl px-4 text-left'
        placeholderTextColor={colors.textPlaceholder}
        placeholder='Referral code'
        id='referralCode'
        onChangeText={(text) => setCode(text.trim().toUpperCase())}
        autoCapitalize='none'
        value={code}
        onSubmitEditing={() => onSubmitReferralCode(code)}
      />
      <TextButton
        className='w-3/4'
        text='Confirm'
        disabled={code.length < 4 || code.length > 8 || loading}
        loading={loading}
        onPress={() => onSubmitReferralCode(code)}
      />
    </div>
  );
}
