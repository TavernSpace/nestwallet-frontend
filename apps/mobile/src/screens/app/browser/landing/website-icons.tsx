import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import { Origin } from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import { withSize } from '@nestwallet/app/common/utils/style';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Image } from '@nestwallet/app/components/image';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_WIDTH, colors } from '@nestwallet/app/design/constants';

interface RecentsIconProps {
  website: Origin;
  onPress: (url: string) => void;
  onDelete?: (url: string) => void;
}

export function RecentsIcon(props: RecentsIconProps) {
  const { website, onPress, onDelete } = props;

  if (!website.url) return;

  const url = new URL(website.url);
  const icon = getOriginIcon(url.origin);
  const width = (SCREEN_WIDTH - 48) / 2;
  const domain = url.hostname.startsWith('www.')
    ? url.hostname.slice(4)
    : url.hostname;

  return (
    <BaseButton onPress={() => onPress(website.url!)}>
      <View
        className='bg-card flex flex-col justify-between rounded-3xl py-4'
        style={withSize(width)}
      >
        <View className='rounded-2xl px-4'>
          <Image
            source={{ uri: icon }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
            }}
          />
        </View>
        <View className='flex flex-col px-4' style={{ width }}>
          <Text
            className='text-text-primary text-sm font-medium'
            numberOfLines={2}
          >
            {website.title}
          </Text>
          <Text
            className='text-text-secondary text-xs font-normal'
            numberOfLines={1}
          >
            {domain}
          </Text>
        </View>
        {onDelete && (
          <View className='absolute right-[18px] top-[18px]'>
            <BaseButton onPress={() => onDelete(website.url!)}>
              <FontAwesomeIcon
                icon={faTimes}
                color={colors.textSecondary}
                size={20}
              />
            </BaseButton>
          </View>
        )}
      </View>
    </BaseButton>
  );
}
