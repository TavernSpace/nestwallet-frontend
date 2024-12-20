import cn from 'classnames';
import { useFormik } from 'formik';
import { useState } from 'react';
import { Tuple } from '../../../common/types';
import { tuple } from '../../../common/utils/functions';
import { adjust } from '../../../common/utils/style';
import { BlockchainAvatar } from '../../../components/avatar/blockchain-avatar';
import { LayeredChainAvatar } from '../../../components/avatar/chain-avatar/layered';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { Form } from '../../../components/form';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { supportedChainsForBlockchain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createQuickStartSchema } from './schema';

export function QuickStartScreen(props: {
  onSubmit: (inputs: Tuple<[string, boolean], 3>) => Promise<void>;
}) {
  const { onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [chainEnabled, setChainEnabled] = useState<Tuple<boolean, 3>>([
    true,
    true,
    true,
  ]);

  const handleSubmit = async (inputs: Tuple<string, 3>) => {
    try {
      const joinedInput = inputs.map((input, index) => [
        input,
        chainEnabled[index],
      ]) as Tuple<[string, boolean], 3>;
      await onSubmit(joinedInput);
    } catch (err) {
      const error = parseError(err, localization.defaultError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<Tuple<string, 3>>({
    initialValues: localization.walletNamesTuple[language],
    onSubmit: handleSubmit,
    validationSchema: createQuickStartSchema(language),
  });

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset
        className='h-full w-full'
        hasBottomInset={true}
        shouldAvoidKeyboard={true}
      >
        <Form
          className='flex h-full flex-col justify-between px-4'
          formik={formik}
        >
          <View className='flex w-full flex-col space-y-6 pt-2'>
            {formik.values.map((input, index) => (
              <View
                className='flex w-full flex-row items-center space-x-4'
                key={index}
              >
                <BlockchainAvatar
                  blockchain={
                    index === 0
                      ? IBlockchainType.Evm
                      : index === 1
                      ? IBlockchainType.Svm
                      : IBlockchainType.Tvm
                  }
                  size={adjust(36)}
                />
                <View className='bg-card flex flex-1 flex-col overflow-hidden rounded-2xl'>
                  <View className='flex flex-col space-y-1.5 px-4 py-3 '>
                    <View className='flex flex-row items-center justify-between'>
                      <View className='flex flex-row items-center space-x-1'>
                        <Text className='text-text-secondary text-sm font-medium'>
                          {index === 0
                            ? 'Ethereum'
                            : index === 1
                            ? 'Solana'
                            : 'TON'}
                        </Text>
                        {index === 0 && (
                          <LayeredChainAvatar
                            chains={supportedChainsForBlockchain[
                              IBlockchainType.Evm
                            ].map((chain) => chain.id)}
                            limit={5}
                            displayRemaining={true}
                            size={adjust(18, 2)}
                            border={true}
                            borderColor={colors.card}
                          />
                        )}
                      </View>
                      <BaseButton
                        onPress={() => {
                          const newValues = tuple(...chainEnabled);
                          newValues[index] = !newValues[index];
                          setChainEnabled(newValues);
                        }}
                      >
                        <View
                          className={cn(
                            'flex flex-row items-center rounded-full px-2 py-0.5',
                            {
                              'bg-success/10': chainEnabled[index],
                              'bg-failure/10': !chainEnabled[index],
                            },
                          )}
                        >
                          <Text
                            className={cn('text-xs font-medium', {
                              'text-success': chainEnabled[index],
                              'text-failure': !chainEnabled[index],
                            })}
                          >
                            {chainEnabled[index] ? 'Enabled' : 'Disabled'}
                          </Text>
                        </View>
                      </BaseButton>
                    </View>
                    <TextInput
                      errorText={
                        formik.touched[index] ? formik.errors[index] : undefined
                      }
                      filled={true}
                      inputProps={{
                        onChangeText: (name) => {
                          formik.values[index] = name;
                          formik.setValues(formik.values);
                        },
                        editable: chainEnabled[index],
                        value: formik.values[index],
                      }}
                    />
                  </View>
                  {!chainEnabled[index] && (
                    <View
                      className='pointer-events-none absolute h-full w-full bg-black/20'
                      pointerEvents='none'
                    />
                  )}
                </View>
              </View>
            ))}
          </View>
          <View className='flex flex-col space-y-2'>
            <View className='bg-card rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.quickStartDescription[language]}
              </Text>
            </View>
            <TextButton
              onPress={formik.submitForm}
              text={localization.complete[language]}
              disabled={
                formik.isSubmitting || !chainEnabled.some((value) => value)
              }
              loading={formik.isSubmitting}
            />
          </View>
        </Form>
      </ViewWithInset>
    </View>
  );
}
