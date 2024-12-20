import { faClone } from '@fortawesome/pro-regular-svg-icons';
import { ScrollView } from 'react-native';
import { useCopy } from '../../../common/hooks/copy';
import { ISignerWallet } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { TextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { SeedPhraseCard } from '../../add-wallet/create-seed/screen';
import { secretTypeToLabel } from '../utils';
import { SecretType } from './types';

interface RevealKeyScreenProps {
  signer: ISignerWallet;
  data: string;
  secretType: SecretType;
  onBack: VoidFunction;
}

export function RevealKeyScreen(props: RevealKeyScreenProps) {
  const { signer, data, secretType, onBack } = props;
  const { copy } = useCopy(
    secretType === 'seed' ? 'Copied seed phrase!' : 'Copied private key!',
  );

  const walletTypeLabel = secretTypeToLabel(secretType);
  const size = adjust(36);

  return (
    <ViewWithInset
      className='flex h-full flex-col justify-between'
      hasBottomInset={true}
    >
      <ScrollView
        className='px-4'
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View className='flex-row items-center space-x-4'>
          <WalletAvatar wallet={signer} size={size} />
          <Text className='text-text-primary text-xl font-bold'>
            {walletTypeLabel}
          </Text>
        </View>
        <Text className='text-text-secondary mt-2 text-sm font-medium'>
          {`Your ${walletTypeLabel.toLowerCase()} is used to back up your wallet. Don't share it with anyone.`}
        </Text>
        {secretType === 'seed' ? (
          <SeedPhraseCard seedPhrase={data.split(' ')} />
        ) : (
          <PrivateKeySection privateKey={data} />
        )}
        <View className='w-full items-center justify-center pt-2'>
          <BaseButton
            className='overflow-hidden rounded-xl'
            onPress={() => copy(data)}
          >
            <View className='bg-card flex flex-row items-center justify-center space-x-2 rounded-xl px-3 py-2'>
              <FontAwesomeIcon
                icon={faClone}
                className='text-text-secondary'
                size={adjust(14, 2)}
              />
              <Text className='text-text-secondary text-sm font-medium'>
                Copy
              </Text>
            </View>
          </BaseButton>
        </View>
      </ScrollView>

      <View className='mt-6 flex flex-col space-y-2 px-4'>
        <TextButton text='Done' onPress={onBack} />
      </View>
    </ViewWithInset>
  );
}

function PrivateKeySection(props: { privateKey: string }) {
  const { privateKey } = props;
  return (
    <View className='pt-4'>
      <TextInput
        inputProps={{
          id: 'private_key_reveal',
          multiline: true,
          textAlignVertical: 'top',
          numberOfLines: 5,
          value: privateKey,
          style: { minHeight: 100 },
          editable: false,
        }}
      />
    </View>
  );
}
