import {
  faApple,
  faChrome,
  faGooglePlay,
} from '@fortawesome/free-brands-svg-icons';
import {
  faChevronLeft,
  faCircleExclamation,
  faEnvelope,
  faRocketLaunch,
  faWreathLaurel,
} from '@fortawesome/pro-solid-svg-icons';
import HeroBg from '@nestwallet/app/assets/images/home/hero/background.png';
import NestLogo from '@nestwallet/app/assets/images/logos/nest-logo-light.svg';
import { GenerateSignInCodeInput } from '@nestwallet/app/common/api/nestwallet/types';
import { delay } from '@nestwallet/app/common/api/utils';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { TextButton } from '@nestwallet/app/components/button/text-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { TextInput } from '@nestwallet/app/components/text-input';
import { CodeInput } from '@nestwallet/app/components/text-input/code';
import { colors } from '@nestwallet/app/design/constants';
import { parseError } from '@nestwallet/app/features/errors';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { ShowSnackbarSeverity } from '@nestwallet/app/provider/snackbar';
import { createLoginEmailSectionSchema } from '@nestwallet/app/screens/auth/schema';
import cn from 'classnames';
import { useFormik } from 'formik';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { FormikSignInInput } from '.';
import {
  appStoreUrl,
  chromeWebStoreUrl,
  googlePlayStoreUrl,
} from '../home/utils';
import { useWebSnackbar } from '../provider/snackbar';

interface LoginScreenProps {
  isLoadingReferralCode: boolean;
  isValidReferralCode: boolean | undefined;
  referralCode?: string;
  onSubmitEmail: (input: GenerateSignInCodeInput) => Promise<void>;
  onSubmitCode: (input: FormikSignInInput) => Promise<void>;
}

export function LoginScreen(props: LoginScreenProps) {
  const {
    isLoadingReferralCode,
    isValidReferralCode,
    referralCode,
    onSubmitEmail,
    onSubmitCode,
  } = props;

  const { showSnackbar } = useWebSnackbar();

  const [bannerScale, setBannerScale] = useState(1);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [refreshable, setRefreshable] = useState(true);

  const emailFormik = useFormik<GenerateSignInCodeInput>({
    initialValues: {
      email: '',
    },
    validationSchema: createLoginEmailSectionSchema(ILanguageCode.En),
    onSubmit: async (values) => {
      await handleEmailSubmission(
        values,
        'A one time code has been sent to your email',
      );
    },
  });

  const errorText = emailFormik.touched.email
    ? emailFormik.errors.email
    : undefined;

  const validate = (value: FormikSignInInput) => {
    const code = value.oneTimeCode.join('');
    const isValid = code.length === 6 && /^[0-9a-zA-Z]+$/.test(code);
    return isValid
      ? undefined
      : { oneTimeCode: 'The code must be exactly 6 characters' };
  };

  const codeFormik = useFormik<FormikSignInInput>({
    initialValues: {
      isMobile: false,
      isWeb: true,
      email: emailFormik.values.email,
      oneTimeCode: ['', '', '', '', '', ''],
    },
    validate,
    onSubmit: async (values) => {
      await handleSubmitCode(values);
    },
  });

  const handleAnimateBanner = async () => {
    await delay(300);
    setBannerScale(1.2);
    await delay(1200);
    setBannerScale(1);
  };

  const handleEmailSubmission = async (
    input: GenerateSignInCodeInput,
    successMessage: string,
  ) => {
    try {
      await onSubmitEmail(input);
      setShowCodeInput(true);

      // delay to make disabled time not feel too short and syncs up
      await delay(80);
      showSnackbar({
        duration: 4000,
        message: successMessage,
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
      setRefreshable(true);
    }
  };

  const handleSubmitCode = async (input: FormikSignInInput) => {
    try {
      await onSubmitCode(input);
    } catch (err) {
      const error = parseError(err);
      showSnackbar({
        duration: 4000,
        message: error.message,
        severity: ShowSnackbarSeverity.error,
      });
    }
  };

  useEffect(() => {
    handleAnimateBanner();
  }, []);

  useEffect(() => {
    if (showCodeInput) {
      codeFormik.setFieldValue('email', emailFormik.values.email);
    }
  }, [showCodeInput, emailFormik.values.email]);

  return (
    <div className='flex h-full w-full flex-col items-center justify-center overflow-hidden'>
      <div className='absolute flex h-full w-full items-center justify-center overflow-hidden'>
        <div
          className='flex overflow-hidden'
          style={{ marginLeft: -500, height: 1250 }}
        >
          <Image src={HeroBg} alt={''} />
          <Image src={HeroBg} alt={''} />
          <Image src={HeroBg} alt={''} />
        </div>
      </div>
      <div className='mb-4 h-10'>
        {!isLoadingReferralCode && referralCode && referralCode.length > 0 ? (
          <div
            className={cn(
              'text-xss mb-4 flex h-10 flex-row items-center justify-center space-x-4 rounded-full px-3 transition-all duration-500 md:px-10 md:text-base',
              {
                'text-success bg-success/10': isValidReferralCode,
                'text-failure bg-failure/10': !isValidReferralCode,
              },
            )}
            style={{ transform: `scale(${bannerScale})` }}
            onMouseEnter={() => setBannerScale(1.2)}
            onMouseLeave={() => setBannerScale(1)}
          >
            <FontAwesomeIcon
              icon={faCircleExclamation}
              color={isValidReferralCode ? colors.success : colors.failure}
            />
            {isValidReferralCode ? (
              <div className='flex flex-row space-x-1'>
                <div>Using referral code:</div>
                <div className='font-bold'>{referralCode}</div>
                <div>| You earn </div>
                <div className='font-bold'>20%</div>
                <div> bonus $NEST XP! </div>
              </div>
            ) : (
              <div>{`${referralCode} is not a valid referral code!`}</div>
            )}
          </div>
        ) : (
          <div className='h-10' />
        )}
      </div>
      <div className='flex w-full flex-col items-center justify-center space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0'>
        <div className='bg-card flex w-[90%] max-w-[450px] flex-col items-center justify-center rounded-3xl backdrop-blur-sm'>
          <div className='relative flex h-full min-h-[560px] w-full flex-col space-y-10 px-10 py-10'>
            {showCodeInput ? (
              <IconButton
                className='absolute'
                color={colors.textPrimary}
                icon={faChevronLeft}
                size={20}
                onPress={() => setShowCodeInput(false)}
              />
            ) : (
              <div className='h-[30]' />
            )}

            <div className='flex w-full flex-col items-center justify-center'>
              <div className='flex h-16 w-16 items-center justify-center overflow-hidden rounded-full'>
                <Image src={NestLogo} alt='' height={64} width={64} />
              </div>
              <div className='text-text-primary mt-8 text-4xl font-medium'>
                Sign in
              </div>
              <div className='mt-5 flex flex-row space-x-1 text-center text-sm font-medium'>
                <div className='text-text-secondary'>
                  {showCodeInput
                    ? `Login code sent to `
                    : 'View your referral dashboard before installing the app!'}
                </div>
                <div className='text-text-primary'>
                  {showCodeInput && `${emailFormik.values.email}`}
                </div>
              </div>

              <div className='mt-10 flex w-full flex-col'>
                {showCodeInput ? (
                  <div className='space-y-4'>
                    <CodeInput
                      length={6}
                      text={codeFormik.values.oneTimeCode}
                      onChange={(text) => {
                        codeFormik.setFieldValue(
                          'oneTimeCode',
                          text.map((t) => t.toUpperCase()),
                        );
                      }}
                    />
                    <div className='flex flex-row items-center justify-center space-x-1'>
                      <div className='text-text-secondary text-sm'>
                        Didn't receive a code?
                      </div>
                      <TextButton
                        className={cn('underline', {
                          'text-primary': refreshable,
                          'text-text-secondary': !refreshable,
                        })}
                        type='transparent'
                        disabled={!refreshable || codeFormik.isSubmitting}
                        onPress={() =>
                          handleEmailSubmission(
                            { email: emailFormik.values.email },
                            'A one time code has been resent to your email',
                          )
                        }
                        text='Resend'
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <TextInput
                      inputProps={{
                        id: 'email',
                        placeholder: 'Enter your email',
                        onChangeText: (text: string) =>
                          emailFormik.handleChange('email')(text.trim()),
                        autoCapitalize: 'none',
                        autoComplete: 'email',
                        inputMode: 'email',
                        keyboardType: 'email-address',
                        textContentType: 'emailAddress',
                        value: emailFormik.values.email,
                        onSubmitEditing: emailFormik.submitForm,
                      }}
                      filled={true}
                      startAdornment={
                        <div className='flex items-center justify-center pl-3'>
                          <FontAwesomeIcon
                            icon={faEnvelope}
                            size={16}
                            color={colors.textSecondary}
                          />
                        </div>
                      }
                    />
                    {errorText && (
                      <div style={{ marginTop: 8 }}>
                        <div className='bg-failure/10 w-full justify-center rounded-lg px-4 py-2'>
                          <span className='text-failure text-xs font-medium'>
                            {errorText}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className='absolute bottom-0 left-0 right-0 flex w-full flex-col items-center p-10'>
              <TextButton
                className='w-full'
                loading={codeFormik.isSubmitting || emailFormik.isSubmitting}
                disabled={codeFormik.isSubmitting || emailFormik.isSubmitting}
                onPress={
                  showCodeInput ? codeFormik.submitForm : emailFormik.submitForm
                }
                text={showCodeInput ? 'Login' : 'Continue'}
              />
            </div>
          </div>
        </div>
        <>
          <div className='bg-text-secondary/50 flex h-full w-[2px] flex-col items-center justify-center rounded-full'>
            <div className='text-text-primary bg-background absolute text-xl'>
              or
            </div>
          </div>
          <div className='bg-card flex w-[90%] max-w-[450px] flex-col items-center justify-center rounded-3xl backdrop-blur-sm md:h-full'>
            <div className='text-text-secondary flex h-full w-full flex-col space-y-3 px-10 py-10 text-sm md:text-lg'>
              <div className='text-text-primary mb-4 text-2xl'>
                Don't want to use an account?
              </div>

              <div className='flex flex-row items-center space-x-2'>
                <div>1: Download the </div>
                <div className='text-primary font-bold'>Nest Wallet</div>
                <div>app</div>
              </div>
              <div className='flex flex-row items-center space-x-2'>
                <div>2: Tap</div>
                <FontAwesomeIcon icon={faRocketLaunch} color={colors.primary} />
              </div>
              <div className='flex flex-row items-center space-x-2'>
                <div>3: Follow the instructions to mint your </div>
                <FontAwesomeIcon icon={faWreathLaurel} color={colors.primary} />
                <div className='text-primary'>Nest</div>
              </div>
              <div className='flex flex-row items-center space-x-2 '>
                <div>4: Tap</div>
                <div className='text-text-primary'>Referral Program</div>
              </div>

              <div className='flex flex-row items-center space-x-2'>
                <div>5: Tap</div>
                <div className='text-background bg-primary rounded-full px-3 py-1 text-xs font-bold'>
                  Add Referrer
                </div>
              </div>

              <div className='flex flex-row items-center space-x-2'>
                <div>6: Enter code:</div>
                <div className='text-success font-bold'>{referralCode}</div>
              </div>
            </div>
            <div className='mb-10 flex w-full flex-col items-center justify-between space-y-4 px-6 md:flex-row  md:space-x-4 md:space-y-0'>
              <BaseButton
                className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
                onPress={() => Linking.openURL(chromeWebStoreUrl)}
              >
                <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
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
                <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
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
                <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
                  <FontAwesomeIcon
                    color={colors.textButtonPrimary}
                    icon={faGooglePlay}
                    size={20}
                  />
                  <div className='text-sm font-bold text-slate-900'>
                    Android
                  </div>
                </div>
              </BaseButton>
            </div>
          </div>
        </>
      </div>
    </div>
  );
}
