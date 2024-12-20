import {
  GenerateSignInCodeInput,
  SignInInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { delay } from '@nestwallet/app/common/api/utils';
import { Tuple } from '@nestwallet/app/common/types';
import { parseError } from '@nestwallet/app/features/errors';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../provider/auth';
import { LoginScreen } from './screen';

export interface FormikSignInInput extends Omit<SignInInput, 'oneTimeCode'> {
  oneTimeCode: Tuple<string, 6>;
}

export function LoginWithQuery() {
  const { apiClient } = useNestWallet();
  const { signIn } = useAuthContext();
  const router = useRouter();

  const [referralLink, setReferralLink] = useState('');
  const [isValidReferralCode, setIsValidReferralCode] = useState<
    boolean | undefined
  >(undefined);
  const [isLoadingReferralCode, setIsLoadingReferralCode] = useState(true);

  const referralCode =
    typeof router.query.referral === 'string' && router.query.referral !== ''
      ? router.query.referral
      : undefined;

  const handleGetReferralLink = async (code: string) => {
    if (!code || code.length <= 0) return;
    try {
      const response = await apiClient.getReferralLink(code);
      setReferralLink(response.referralLink);
      setIsValidReferralCode(true);
    } catch (err) {
      const error = parseError(err);
      setIsValidReferralCode(false);
      if (
        error.message !== 'referral code is required' &&
        error.message !== 'referral code not found'
      ) {
        throw err;
      }
    } finally {
      setIsLoadingReferralCode(false);
    }
  };

  useEffect(() => {
    if (referralCode) {
      handleGetReferralLink(referralCode);
    }
  }, [referralCode]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isMobile = /Mobi|Android/i.test(userAgent);

    if (isMobile && referralLink && referralLink.length > 0) {
      window.location.href = referralLink;
    }
  }, [referralLink]);

  const handleSubmitEmail = async (input: GenerateSignInCodeInput) => {
    await apiClient.generateSigninCode({ email: input.email });
  };

  const handleSubmitCode = async (input: FormikSignInInput) => {
    await signIn({
      isMobile: false,
      email: input.email,
      oneTimeCode: input.oneTimeCode.join(''),
    });

    // we add a delay since we need some time for referral code creation for new users
    await delay(100);

    if (referralCode) {
      router.push({
        pathname: '/dashboard',
        query: {
          referral: referralCode,
        },
      });
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <LoginScreen
      referralCode={referralCode}
      isLoadingReferralCode={isLoadingReferralCode}
      isValidReferralCode={isValidReferralCode}
      onSubmitEmail={handleSubmitEmail}
      onSubmitCode={handleSubmitCode}
    />
  );
}
