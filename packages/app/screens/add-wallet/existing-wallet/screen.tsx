import {
  faCreditCardBlank,
  faKeySkeleton,
  faSeedling,
} from '@fortawesome/pro-solid-svg-icons';
import { adjust, withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function AddExistingWalletScreen(props: {
  blockchain: IBlockchainType;
  onSecretRecoveryPhrase: VoidFunction;
  onPrivateKey: VoidFunction;
}) {
  const { blockchain, onSecretRecoveryPhrase, onPrivateKey } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);
  const iconSize = adjust(18, 2);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faCreditCardBlank}
            color={colors.success}
            size={48}
          />
        </View>
        <View className='mt-4 flex w-full flex-col justify-center'>
          <Text className='text-text-primary text-xl font-bold'>
            {localization.importExistingWallet[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-medium'>
            {localization.chooseMethod[language]}
          </Text>
          <View className='mt-4 space-y-2'>
            <ButtonListItem
              onPress={onSecretRecoveryPhrase}
              title={localization.seedPhrase[language]}
              subtitle={localization.seedPhraseDescription[language]}
            >
              <View
                className='bg-success/10 mt-1 flex flex-row items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faSeedling}
                  size={iconSize}
                  color={colors.success}
                />
              </View>
            </ButtonListItem>
            <ButtonListItem
              onPress={onPrivateKey}
              title={localization.privateKey[language]}
              subtitle={
                localization.privateKeyDescription(
                  onBlockchain(blockchain)(
                    () => '64',
                    () => '87-88',
                    () => '128',
                  ),
                )[language]
              }
            >
              <View
                className='bg-approve/10 mt-1 flex flex-row items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faKeySkeleton}
                  size={iconSize}
                  color={colors.approve}
                />
              </View>
            </ButtonListItem>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
