import { faGiftCard, faReceipt } from '@fortawesome/pro-solid-svg-icons';
import { parseError } from '@nestwallet/app/features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { useFormik } from 'formik';
import { styled } from 'nativewind';
import { useState } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { Loadable } from '../../../common/types';
import { onLoadable } from '../../../common/utils/query';
import { adjust } from '../../../common/utils/style';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import {
  IClaimPromoCodeInput,
  IPromoCode,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { SvgItem } from '../../wallet-details/rewards/referral-section/rewards-summary-card';
import { PromoListItem } from './item';
import { localization } from './localization';
import { createPromoCodeClaimSchema } from './schema';

interface FormikPromoCodeInput {
  code: string;
}

export function PromoCodeScreen(props: {
  promoCodes: Loadable<IPromoCode[]>;
  onClaimPromoCode: (
    claimPromoCodeInput: IClaimPromoCodeInput,
  ) => Promise<void>;
}) {
  const { promoCodes, onClaimPromoCode } = props;
  const { language } = useLanguageContext();
  const { showSnackbar } = useSnackbar();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: FormikPromoCodeInput) => {
    try {
      setIsSubmitting(true);
      await onClaimPromoCode({ code: values.code });
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.promoCodeAdded[language],
      });
    } catch (err) {
      const appError = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: appError.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formik = useFormik<FormikPromoCodeInput>({
    initialValues: {
      code: '',
    },
    validationSchema: createPromoCodeClaimSchema(language),
    onSubmit: handleSubmit,
  });

  return onLoadable(promoCodes)(
    () => null,
    () => null,
    (promoCodes) => (
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <Form
          className='flex h-full flex-col justify-between px-4'
          formik={formik}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps={
              Platform.OS === 'web' ? undefined : 'handled'
            }
          >
            <View className='mt-2 flex flex-col space-y-6'>
              <View className='flex flex-col space-y-4'>
                <View className='flex flex-col space-y-4'>
                  <View className='flex flex-row items-center justify-center'>
                    <View className='bg-primary/10 h-16 w-16 items-center justify-center rounded-full'>
                      <FontAwesomeIcon
                        icon={faGiftCard}
                        color={colors.primary}
                        size={adjust(36)}
                      />
                    </View>
                  </View>
                  <Text className='text-text-secondary text-sm font-normal'>
                    {localization.addPromoCodeDescription[language]}
                  </Text>
                </View>
                <View className='mt-6 space-y-4'>
                  <TextInput
                    inputProps={{
                      id: 'code',
                      placeholder: localization.enterAPromoCode[language],
                      onChangeText: (text) => {
                        const uppercasedText = text.toUpperCase();
                        formik.setFieldValue('code', uppercasedText);
                      },
                      value: formik.values.code,
                      onBlur: formik.handleBlur('code'),
                    }}
                  />
                  <TextButton
                    onPress={formik.submitForm}
                    loading={isSubmitting}
                    disabled={isSubmitting || !formik.values.code}
                    text={localization.redeem[language]}
                  />
                </View>
              </View>

              <View className='flex flex-col space-y-6'>
                <View className='flex flex-col space-y-2'>
                  <Text className='text-text-primary text-sm font-bold'>
                    {localization.summary[language]}
                  </Text>
                  <PromoSummaryCard promoCodes={promoCodes} />
                </View>
                <View className='flex flex-col space-y-2'>
                  <Text className='text-text-primary text-sm font-bold'>
                    {localization.activePromotions[language]}
                  </Text>
                  {promoCodes.length === 0 ? (
                    <View>
                      <PromoCodeEmptyState />
                    </View>
                  ) : (
                    promoCodes.map((promo) => (
                      <PromoListItem key={promo.code} promo={promo} />
                    ))
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </Form>
      </ViewWithInset>
    ),
  );
}

const PromoSummaryCard = styled(function (props: {
  promoCodes: IPromoCode[];
  style?: StyleProp<ViewStyle>;
}) {
  const { promoCodes, style } = props;

  const totalXp = promoCodes.reduce(
    (sum, promo) => sum + (promo.points || 0),
    0,
  );
  const maxFeeEvm = promoCodes.reduce(
    (max, promo) => Math.max(max, promo.feeEvmDiscount || 0),
    0,
  );
  const maxFeeSvm = promoCodes.reduce(
    (max, promo) => Math.max(max, promo.feeSvmDiscount || 0),
    0,
  );
  const maxFeeTvm = promoCodes.reduce(
    (max, promo) => Math.max(max, promo.feeTvmDiscount || 0),
    0,
  );

  const formatPercentage = (value: number) => `${value}%`;

  return (
    <View className='bg-card w-full space-y-2 rounded-2xl p-4' style={style}>
      <View className='flex w-full flex-row space-x-3 py-1'>
        <SvgItem
          source={{
            uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/xp.svg',
          }}
          width={adjust(30, 2)}
          height={adjust(24, 2)}
          label={`${totalXp}xp`}
        />
        <SvgItem
          source={{
            uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ethereum.svg',
          }}
          width={adjust(36, 2)}
          height={adjust(36, 2)}
          label={formatPercentage(maxFeeEvm)}
        />
        <SvgItem
          source={{
            uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg',
          }}
          width={adjust(36, 2)}
          height={adjust(36, 2)}
          label={formatPercentage(maxFeeSvm)}
        />
        <SvgItem
          source={{
            uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ton.svg',
          }}
          width={adjust(36, 2)}
          height={adjust(36, 2)}
          label={formatPercentage(maxFeeTvm)}
        />
      </View>
    </View>
  );
});

function PromoCodeEmptyState() {
  const { language } = useLanguageContext();
  return (
    <View className='bg-card flex flex-col items-center justify-center space-y-4 rounded-2xl px-4 py-8'>
      <View className='bg-primary/10 h-16 w-16 items-center justify-center rounded-full'>
        <FontAwesomeIcon
          icon={faReceipt}
          size={adjust(36)}
          color={colors.primary}
        />
      </View>
      <Text className='text-text-secondary mx-4 my-4 text-center text-sm font-normal'>
        {localization.emptyStateText[language]}
      </Text>
    </View>
  );
}
