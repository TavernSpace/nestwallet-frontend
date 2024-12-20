import { faPuzzlePiece, faThumbTack } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ILanguageCode } from '../../graphql/client/generated/graphql';
import { localization } from './localization';

export function PinBanner(props: { language: ILanguageCode }) {
  const { language } = props;
  return (
    <View className='bg-primary space-y-1 rounded-lg px-4 py-3'>
      <Text className='text-text-button-primary text-sm font-medium'>
        {localization.pinExtension[language]}
      </Text>
      <View className='flex flex-row items-center space-x-1'>
        <Text className='text-text-button-primary text-sm font-medium'>
          {localization.click[language]}
        </Text>
        <View className='px-1'>
          <FontAwesomeIcon
            icon={faPuzzlePiece}
            color={colors.textButtonPrimary}
          />
        </View>
        <Text className='text-text-button-primary text-sm font-medium'>
          {localization.andThen[language]}
        </Text>
        <View className='px-1'>
          <FontAwesomeIcon
            icon={faThumbTack}
            color={colors.textButtonPrimary}
          />
        </View>
        <Text className='text-text-button-primary text-sm font-medium'>
          {localization.andDone[language]}
        </Text>
      </View>
    </View>
  );
}
