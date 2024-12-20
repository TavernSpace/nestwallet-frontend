import { faGlobe } from '@fortawesome/pro-light-svg-icons';
import { useState } from 'react';
import { useLoadImage } from '../../common/hooks/image';
import { Origin } from '../../common/types';
import { withSize } from '../../common/utils/style';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

export function OriginSection(props: { origin?: Origin }) {
  const { origin } = props;
  const { language } = useLanguageContext();

  const [loadError, setLoadError] = useState(false);
  const [image, error] = useLoadImage(
    origin?.favIconUrl,
    'https://www.google.com/s2/',
  );

  const url = origin?.url ? new URL(origin.url) : undefined;
  const domain = !url
    ? undefined
    : url.hostname.startsWith('www.')
    ? url.hostname.slice(4)
    : url.hostname;

  return (
    <View
      className='flex w-full flex-col items-center justify-center'
      style={{ width: SCREEN_WIDTH - 32 }}
    >
      {!error && !loadError && !!image ? (
        <Image
          className='rounded-2xl'
          source={{ uri: image }}
          onError={() => setLoadError(true)}
          style={withSize(64)}
        />
      ) : !error && !loadError && !image ? (
        <View
          className='bg-card-highlightitems-center justify-center rounded-2xl'
          style={withSize(64)}
        />
      ) : (
        <View
          className='bg-card-highlight items-center justify-center rounded-2xl'
          style={withSize(64)}
        >
          <FontAwesomeIcon
            icon={faGlobe}
            size={40}
            color={colors.textSecondary}
          />
        </View>
      )}
      <View className='mt-4 flex w-full flex-col items-center justify-center space-y-1'>
        <Text
          className='text-text-primary truncate text-lg font-medium'
          numberOfLines={1}
        >
          {origin?.title ?? localization.unknownOrigin[language]}
        </Text>
        <Text
          className='text-text-secondary truncate text-sm font-normal'
          numberOfLines={1}
        >
          {domain ?? localization.unkownWebsite[language]}
        </Text>
      </View>
    </View>
  );
}
