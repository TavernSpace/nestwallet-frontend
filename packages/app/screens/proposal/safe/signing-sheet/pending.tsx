import {
  faCheckCircle,
  faExclamationCircle,
} from '@fortawesome/pro-solid-svg-icons';
import SigningLottie from '@nestwallet/app/assets/animations/executing-lottie.json';
import { useMemo } from 'react';
import { SignatureType } from '../../../../common/types';
import { TextButton } from '../../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import LottieView from '../../../../components/lottie-view';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { TypedData } from '../../../../features/keyring/types';
import { getDomainAndMessageHash } from '../../../../features/keyring/utils';
import { isHardwareWallet } from '../../../../features/wallet/utils';
import {
  ILanguageCode,
  IWallet,
  IWalletType,
} from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface SigningPendingContentProps {
  wallet: IWallet;
  typedData?: TypedData;
  isLoading: boolean;
  error?: Error;
  type: SignatureType;
  onRetry: VoidFunction;
  onClose: VoidFunction;
  onDone: VoidFunction;
}

export function SigningSheetPendingContent(props: SigningPendingContentProps) {
  const {
    wallet,
    typedData,
    isLoading,
    error,
    type,
    onRetry,
    onClose,
    onDone,
  } = props;
  const { language } = useLanguageContext();

  return isLoading ? (
    <LoadingContent
      language={language}
      type={type}
      wallet={wallet}
      typedData={typedData}
    />
  ) : error ? (
    <ErrorContent
      language={language}
      error={error}
      onClose={onClose}
      onRetry={onRetry}
    />
  ) : (
    <CompleteContent language={language} type={type} onDone={onDone} />
  );
}

function LoadingContent(props: {
  language: ILanguageCode;
  type: SignatureType;
  wallet: IWallet;
  typedData?: TypedData;
}) {
  const { language, type, wallet, typedData } = props;

  const isHardware = isHardwareWallet(wallet);

  const { domainHash, messageHash } = useMemo(() => {
    if (!typedData || !isHardware) return {};
    const { domainHash, messageHash } = getDomainAndMessageHash(typedData);
    return {
      domainHash: `0x${domainHash.toUpperCase()}`,
      messageHash: messageHash ? `0x${messageHash.toUpperCase()}` : null,
    };
  }, [typedData, wallet]);

  return (
    <View className='flex h-full w-full flex-col px-4'>
      <View className='h-1/4' />
      <View className='flex flex-col items-center justify-center'>
        <View className='bg-primary/20 h-20 w-20 items-center justify-center rounded-full'>
          <LottieView
            animatedData={SigningLottie}
            autoplay={true}
            loop={true}
            height={144}
            width={144}
          />
        </View>
        <View className='flex flex-col items-center justify-center space-y-4 pt-6'>
          <Text className='text-text-primary text-lg font-medium'>
            {type === 'transaction'
              ? localization.signingTransaction[language]
              : localization.signingMessage[language]}
          </Text>
          <View className='bg-card flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-3'>
            <Text className='text-text-primary text-center text-xs font-normal'>
              {wallet?.type === IWalletType.Ledger
                ? localization.confirmOnLedger[language]
                : wallet?.type === IWalletType.Trezor
                ? localization.confirmOnTrezor[language]
                : type === 'transaction'
                ? localization.signTransaction[language]
                : localization.signMessage[language]}
            </Text>
            <Text className='text-text-secondary text-center text-xs font-normal'>
              {localization.doNotCloseScreen[language]}
            </Text>
          </View>
        </View>
        {!!domainHash && (
          <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
            <Text className='text-text-primary text-xs font-normal'>
              {localization.domainHash[language]}
            </Text>
            <Text className='text-text-secondary text-wrap break-all text-xs font-normal'>
              {domainHash}
            </Text>
          </View>
        )}
        {!!messageHash && (
          <View className='bg-card mt-4 rounded-2xl px-4 py-3'>
            <Text className='text-text-primary text-xs font-normal'>
              {localization.messageHash[language]}
            </Text>
            <Text className='text-text-secondary text-wrap break-all text-xs font-normal'>
              {messageHash}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ErrorContent(props: {
  language: ILanguageCode;
  error: Error;
  onRetry: VoidFunction;
  onClose: VoidFunction;
}) {
  const { language, error, onClose, onRetry } = props;

  return (
    <View className='flex h-full flex-col px-4'>
      <View className='h-1/4' />
      <View className='flex flex-1 flex-col justify-between'>
        <View className='flex flex-col items-center'>
          <View className='bg-failure/20 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faExclamationCircle}
              color={colors.failure}
              size={48}
            />
          </View>
          <View className='flex flex-col items-center space-y-4 pt-6'>
            <Text className='text-text-primary text-lg font-medium'>
              {localization.failedToSign[language]}
            </Text>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <View className='flex flex-col space-y-2'>
                <Text className='text-text-primary text-xs font-normal'>
                  {localization.errorHeader[language]}
                </Text>
                <Text
                  className='text-text-secondary truncate text-xs font-normal'
                  numberOfLines={6}
                >
                  {error.message}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className='flex flex-row items-center space-x-4'>
          <TextButton
            className='flex-1'
            onPress={onClose}
            type='tertiary'
            text={localization.cancel[language]}
          />
          <TextButton
            className='flex-1'
            onPress={onRetry}
            text={localization.retry[language]}
          />
        </View>
      </View>
    </View>
  );
}

function CompleteContent(props: {
  language: ILanguageCode;
  type: SignatureType;
  onDone: VoidFunction;
}) {
  const { language, type, onDone } = props;

  const signatureType =
    type === 'transaction'
      ? localization.transaction[language]
      : localization.message[language];

  return (
    <View className='flex h-full flex-col px-4'>
      <View className='h-1/4' />
      <View className='flex flex-1 flex-col justify-between'>
        <View className='flex flex-col items-center justify-center space-y-6'>
          <View className='bg-success/20 h-20 w-20 items-center justify-center rounded-full'>
            <FontAwesomeIcon
              icon={faCheckCircle}
              size={48}
              color={colors.success}
            />
            <View className='absolute'>
              <LottieView
                autoplay={true}
                loop={false}
                path='https://assets6.lottiefiles.com/packages/lf20_obhph3sh.json'
                height={400}
                width={400}
              />
            </View>
          </View>
          <View className='flex flex-col items-center justify-center space-y-4'>
            <Text className='text-text-primary text-lg font-medium'>
              {type === 'transaction'
                ? localization.transactionSuccessfullySigned[language]
                : localization.messageSuccessfullySigned[language]}
            </Text>
            <View className='bg-card flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-center text-xs font-normal'>
                {
                  localization.successfullySignedDescription(signatureType)[
                    language
                  ]
                }
              </Text>
            </View>
          </View>
        </View>
        <View className='flex h-1/4 flex-col justify-end space-y-2 pt-4'>
          <TextButton text={localization.done[language]} onPress={onDone} />
        </View>
      </View>
    </View>
  );
}
