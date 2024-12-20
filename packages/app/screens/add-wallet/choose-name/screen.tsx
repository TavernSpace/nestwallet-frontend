import { useFormik } from 'formik';
import { useState } from 'react';
import { ReactNativeFile } from '../../../common/hooks/graphql';
import { TextButton } from '../../../components/button/text-button';
import { FileInput } from '../../../components/file-input/default';
import { Form } from '../../../components/form';
import { ScrollView } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { onBlockchain } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';
import { createNameSchema } from './schema';

export interface NameInput {
  name: string;
}

interface ChooseNameScreenProps {
  wallet?: IWallet;
  blockchain: IBlockchainType;
  address: string;
  name: string | undefined;
  onSubmit: (name: string, image?: File | ReactNativeFile) => Promise<void>;
}

export function ChooseNameScreen(props: ChooseNameScreenProps) {
  const { wallet, blockchain, address, name, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [image, setImage] = useState<ReactNativeFile | File>();

  const handleOnSubmit = async (input: NameInput) => {
    try {
      await onSubmit(input.name, image);
    } catch (err) {
      const error = parseError(err, localization.defaultError[language]);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  const formik = useFormik<NameInput>({
    initialValues: {
      name:
        name ||
        onBlockchain(blockchain)(
          () => localization.ethWallet[language],
          () => localization.solWallet[language],
          () => localization.tonV4Wallet[language],
        ),
    },
    onSubmit: handleOnSubmit,
    validationSchema: createNameSchema(language),
  });

  const isSeed = !!wallet && wallet.type === IWalletType.SeedPhrase;

  return (
    <ViewWithInset
      className='h-full w-full'
      hasBottomInset={true}
      shouldAvoidKeyboard={true}
    >
      <Form
        className='flex h-full w-full flex-col justify-between pt-4'
        formik={formik}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        >
          <View className='space-y-4 px-4'>
            <View className='space-y-4'>
              <View className='flex flex-row justify-center'>
                <FileInput
                  title={localization.fileInputTitle[language]}
                  value={image}
                  defaultValue={wallet?.profilePicture ?? undefined}
                  onChange={(value) => setImage(value)}
                  onDelete={() => setImage(undefined)}
                />
              </View>
            </View>
            <View className='flex flex-col space-y-2'>
              <Text className='text-text-primary text-sm font-medium'>
                Name
              </Text>
              <TextInput
                errorText={formik.touched.name ? formik.errors.name : undefined}
                inputProps={{
                  id: 'name',
                  placeholder: localization.walletNamePlaceholder[language],
                  onChangeText: formik.handleChange('name'),
                  value: formik.values.name,
                }}
              />
            </View>
            <View className='flex flex-col space-y-2'>
              <Text className='text-text-primary text-sm font-medium'>
                {localization.address[language]}
              </Text>
              <TextInput
                inputProps={{
                  id: 'address',
                  value: address,
                  editable: false,
                }}
              />
            </View>
          </View>
        </ScrollView>
        <View className='flex flex-col space-y-2 px-4'>
          {isSeed ? (
            <View className='bg-card flex flex-col rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.wrongType[language]}
              </Text>
            </View>
          ) : blockchain === IBlockchainType.Tvm ? (
            <View className='bg-card flex flex-col rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.tonV4Message[language]}
              </Text>
            </View>
          ) : null}
          <TextButton
            onPress={formik.submitForm}
            text={localization.complete[language]}
            loading={formik.isSubmitting}
            disabled={formik.isSubmitting || isSeed}
          />
        </View>
      </Form>
    </ViewWithInset>
  );
}
