import {
  faTelegram,
  faTwitter,
  faWhatsapp,
} from '@fortawesome/free-brands-svg-icons';
import { faChain } from '@fortawesome/pro-solid-svg-icons';
import { adjust, withSize } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';

interface ShareItemProps {
  handleRedirect: (option: keyof ShareOptions) => Promise<void>;
}

export interface ShareOptions {
  copy: string;
  telegram: string;
  twitter: string;
  whatsapp: string;
}

export function ShareItem(props: ShareItemProps) {
  const { handleRedirect } = props;

  const size = adjust(36);
  const iconSize = adjust(20, 2);

  return (
    <View className='flex flex-row items-center justify-between pt-4'>
      <BaseButton onPress={() => handleRedirect('copy')}>
        <View
          className='flex flex-col items-center justify-center space-y-1'
          style={{ width: adjust(64, 16) }}
        >
          <View
            className='bg-link items-center justify-center overflow-hidden rounded-full'
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faChain}
              size={iconSize}
              color={colors.textPrimary}
            />
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            {'Share'}
          </Text>
        </View>
      </BaseButton>
      <BaseButton onPress={() => handleRedirect('telegram')}>
        <View
          className='flex flex-col items-center justify-center space-y-1'
          style={{ width: adjust(64, 16) }}
        >
          <View
            className='bg-telegram flex flex-row items-center justify-center rounded-full'
            style={withSize(size)}
          >
            <View className='absolute h-8 w-8 rounded-full bg-white' />
            <View
              className='flex flex-row items-center justify-center rounded-full'
              style={withSize(size)}
            >
              <FontAwesomeIcon
                icon={faTelegram}
                size={size}
                color={colors.telegram}
              />
            </View>
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            {'Telegram'}
          </Text>
        </View>
      </BaseButton>
      <BaseButton onPress={() => handleRedirect('twitter')}>
        <View
          className='flex flex-col items-center justify-center space-y-1'
          style={{ width: adjust(64, 16) }}
        >
          <View
            className='bg-twitter flex flex-row items-center justify-center overflow-hidden rounded-full'
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faTwitter}
              size={iconSize}
              color={colors.textPrimary}
            />
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            {'Twitter'}
          </Text>
        </View>
      </BaseButton>
      <BaseButton onPress={() => handleRedirect('whatsapp')}>
        <View
          className='flex flex-col items-center justify-center space-y-1'
          style={{ width: adjust(64, 16) }}
        >
          <View
            className='bg-whatsapp flex flex-row items-center justify-center overflow-hidden rounded-full'
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faWhatsapp}
              size={iconSize}
              color={colors.textPrimary}
            />
          </View>
          <Text className='text-text-primary text-sm font-medium'>
            {'WhatsApp'}
          </Text>
        </View>
      </BaseButton>
    </View>
  );
}
