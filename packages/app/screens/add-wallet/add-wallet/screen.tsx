import {
  faKeySkeleton,
  faPlus,
  faSeedling,
  faWallet,
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

export function AddWalletScreen(props: {
  blockchain: IBlockchainType;
  onSeedPhrase: VoidFunction;
  onPrivateKey: VoidFunction;
  onCreateNew: VoidFunction;
}) {
  const { blockchain, onPrivateKey, onSeedPhrase, onCreateNew } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);
  const iconSize = adjust(18, 2);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faWallet} size={44} color={colors.success} />
        </View>
        <View className='mt-8 flex w-full flex-col justify-center'>
          <Text className='text-text-primary text-lg font-medium'>
            {localization.addWallet[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-normal'>
            {localization.addWalletDescription[language]}
          </Text>
          <View className='mt-4 space-y-2'>
            <ButtonListItem
              onPress={onSeedPhrase}
              title={localization.seedPhrase[language]}
              subtitle={localization.seedPhraseSubtitle[language]}
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
                localization.privateKeySubtitle(
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
            <ButtonListItem
              onPress={onCreateNew}
              title={localization.createNew[language]}
              subtitle={localization.createNewSubtitle[language]}
            >
              <View
                className='bg-key-secondary/10 flex flex-row items-center justify-center rounded-full'
                style={withSize(size)}
              >
                <FontAwesomeIcon
                  icon={faPlus}
                  size={iconSize}
                  color={colors.keySecondary}
                />
              </View>
            </ButtonListItem>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}