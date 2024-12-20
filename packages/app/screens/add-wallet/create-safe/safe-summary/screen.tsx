import { faPenToSquare } from '@fortawesome/pro-regular-svg-icons';
import { useState } from 'react';
import { useCopy } from '../../../../common/hooks/copy';
import { VoidPromiseFunction } from '../../../../common/types';
import { adjust } from '../../../../common/utils/style';
import { ChainAvatar } from '../../../../components/avatar/chain-avatar';
import { IconButton } from '../../../../components/button/icon-button';
import { TextButton } from '../../../../components/button/text-button';
import { Field } from '../../../../components/field/field';
import { ScrollView } from '../../../../components/scroll';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { colors } from '../../../../design/constants';
import { getChainInfo } from '../../../../features/chain';
import { parseError } from '../../../../features/errors';
import { CreateSafeInput } from '../../../../features/safe/types';
import { SignerDetail } from '../../../../molecules/transaction/signer';
import { useLanguageContext } from '../../../../provider/language';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '../../../../provider/snackbar';
import { localization } from './localization';

interface CreateSafeSafeSummaryScreenProps {
  input: CreateSafeInput;
  onCreateSafe: VoidPromiseFunction;
  onEditThreshold: VoidFunction;
  onEditName: VoidFunction;
}

export function CreateSafeSafeSummaryScreen(
  props: CreateSafeSafeSummaryScreenProps,
) {
  const { input, onCreateSafe, onEditThreshold, onEditName } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();
  const { copy } = useCopy(localization.copyMessage[language]);

  const [loading, setLoading] = useState(false);

  const chainInfo = getChainInfo(input.chainId);

  const handleCreateSafe = async () => {
    try {
      setLoading(true);
      await onCreateSafe();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.successMessage[language],
      });
    } catch (err) {
      const error = parseError(err, localization.defaultError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between'>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className='space-y-2'>
            <Field label={localization.name[language]}>
              <View className='bg-card mx-4 flex flex-row items-center justify-between rounded-xl px-4 py-4'>
                <Text className='text-text-primary text-sm font-medium'>
                  {input.name}
                </Text>
                <IconButton
                  icon={faPenToSquare}
                  size={adjust(16, 2)}
                  color={colors.textPrimary}
                  onPress={onEditName}
                />
              </View>
            </Field>

            <Field label={localization.network[language]}>
              <View className='bg-card mx-4 rounded-xl px-4 py-4'>
                <View className='flex flex-row items-center'>
                  <ChainAvatar chainInfo={chainInfo} size={adjust(28)} />
                  <View className='w-9/12 px-4'>
                    <Text
                      numberOfLines={1}
                      className='text-text-primary truncate text-sm font-medium'
                    >
                      {chainInfo.name}
                    </Text>
                  </View>
                </View>
              </View>
            </Field>

            <Field label={localization.threshold[language]}>
              <View className='bg-card mx-4 flex flex-row items-center justify-between rounded-xl px-4 py-4'>
                <Text className='text-text-primary text-sm font-medium'>{`${
                  localization.signaturesRequired(
                    input.threshold,
                    input.signers.length,
                  )[language]
                }`}</Text>
                <IconButton
                  icon={faPenToSquare}
                  size={adjust(16, 2)}
                  color={colors.textPrimary}
                  onPress={onEditThreshold}
                />
              </View>
            </Field>

            <Field label={localization.signers[language]}>
              <View className='bg-card mx-4 flex flex-col space-y-6 rounded-xl p-4'>
                {input.signers.map((signer, index) => (
                  <SignerDetail
                    signerInfo={{
                      name:
                        signer.wallet?.name ||
                        signer.contact?.name ||
                        signer.name ||
                        localization.unkownSigner[language],
                      address: signer.address,
                      hasSigned: false,
                      signer: signer.wallet,
                      contact: signer.contact,
                      hasKeyring: false,
                    }}
                    key={index}
                    complete={true}
                  />
                ))}
              </View>
            </Field>
            <View className='px-4'>
              <Text className='text-text-secondary text-center text-xs font-normal'>
                {localization.reviewText[language]}
              </Text>
            </View>
          </View>
        </ScrollView>
        <View className='mt-4 px-4'>
          <TextButton
            onPress={handleCreateSafe}
            text={localization.createSafe[language]}
            loading={loading}
            disabled={loading}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
