import { useMemo, useState } from 'react';
import {
  ISignerWallet,
  Loadable,
  VoidPromiseFunction,
} from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { TextButton } from '../../../components/button/text-button';
import { Field } from '../../../components/field/field';
import { ScrollWrapper } from '../../../components/scroll';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { getChainInfo } from '../../../features/chain';
import { parseError } from '../../../features/errors';
import { useSafeSignerInfo } from '../../../features/proposal/signer';
import { decodeSafeSetupData } from '../../../features/safe/encode';
import { RedeploySafeInput } from '../../../features/safe/types';
import { IContact, IWallet } from '../../../graphql/client/generated/graphql';
import { SignerDetail } from '../../../molecules/transaction/signer';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from '../localization';

interface MultichainDeployExecuteScreenProps {
  wallet: IWallet;
  signers: ISignerWallet[];
  contacts: Loadable<IContact[]>;
  input: RedeploySafeInput;
  onSubmit: VoidPromiseFunction;
}

export function MultichainDeployExecuteScreen(
  props: MultichainDeployExecuteScreenProps,
) {
  const { signers, contacts, input, onSubmit } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);

  const chainInfo = getChainInfo(input.chainId);

  const safeSetupData = useMemo(
    () => decodeSafeSetupData(input.creationInfo.setupData),
    [input],
  );
  const signerInfo = useSafeSignerInfo(
    signers,
    contacts.data ?? [],
    safeSetupData.owners,
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await onSubmit();
      showSnackbar({
        severity: ShowSnackbarSeverity.success,
        message: localization.addedSafe[language],
      });
    } catch (err) {
      const appError = parseError(err);
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: appError.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollWrapper>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <View className='flex flex-1 flex-col justify-between space-y-8'>
          <View className='flex flex-col space-y-4'>
            <Field label={localization.name[language]}>
              <View className='bg-card mx-4 rounded-xl px-4 py-4'>
                <Text className='text-text-primary text-sm font-medium'>
                  {input.name}
                </Text>
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
              <View className='bg-card mx-4 rounded-xl px-4 py-4'>
                <Text className='text-text-primary text-sm font-medium'>
                  {
                    localization.signersRequired(
                      safeSetupData.threshold,
                      safeSetupData.owners.length,
                    )[language]
                  }
                </Text>
              </View>
            </Field>
            <Field label={localization.signers[language]}>
              <View className='bg-card mx-4 flex flex-col space-y-6 rounded-xl p-4'>
                {signerInfo.map((signer) => (
                  <SignerDetail
                    key={signer.address}
                    signerInfo={signer}
                    complete={true}
                  />
                ))}
              </View>
            </Field>
            <View className='px-4'>
              <Text className='text-text-secondary text-center text-xs font-normal'>
                {localization.reviewInformation[language]}
              </Text>
            </View>
          </View>
          <View className='px-4'>
            <TextButton
              onPress={handleSubmit}
              text={localization.confirm[language]}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </ViewWithInset>
    </ScrollWrapper>
  );
}
