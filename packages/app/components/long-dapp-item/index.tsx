import { faPlugCircleXmark } from '@fortawesome/pro-solid-svg-icons';
import { Origin } from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { ConnectionIcon } from '@nestwallet/app/components/connection';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import cn from 'classnames';
import { useState } from 'react';
import { Platform } from 'react-native';
import { adjust } from '../../common/utils/style';
import { ConnectionType } from '../../screens/approval/types';

export function LongDappItem(props: {
  website: Origin;
  showConnection: boolean;
  connectionType?: ConnectionType;
  disabled?: boolean;
  backgroundColor?: string;
  onPressItem: (url: string) => void;
  onPressDelete?: (website: Origin) => void;
}) {
  const {
    website,
    showConnection,
    connectionType = 'injection',
    disabled = false,
    onPressItem,
    onPressDelete,
  } = props;

  const [showDelete, setShowDelete] = useState(false);

  const url = new URL(website.url!);
  const icon = getOriginIcon(url.origin);

  return (
    <BaseButton
      onHoverIn={() => setShowDelete(true)}
      onHoverOut={() => setShowDelete(false)}
      onPress={() => onPressItem(url.toString())}
      disabled={disabled}
    >
      <View
        className={cn('flex w-full flex-row items-center px-4 py-2.5', {
          'space-x-3': Platform.OS === 'web',
          'space-x-4': Platform.OS !== 'web',
        })}
      >
        <ConnectionIcon
          isConnected={true}
          hideBadge={!showConnection}
          size={adjust(24)}
          borderRadius={adjust(8, 2)}
          iconUrl={icon}
          connectionType={connectionType}
        />
        <View className='flex flex-1 flex-col'>
          <Text
            className='text-text-primary truncate text-sm font-medium'
            numberOfLines={1}
          >
            {website.title ?? 'Website'}
          </Text>
          <Text
            className='text-text-secondary truncate text-xs font-normal'
            numberOfLines={1}
          >
            {website.url ?? 'url'}
          </Text>
        </View>
        {onPressDelete && showDelete && Platform.OS === 'web' && (
          <BaseButton
            onHoverIn={() => setShowDelete(true)}
            onPress={() => onPressDelete(website)}
          >
            <View className='bg-failure/10 h-7 w-7 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faPlugCircleXmark}
                size={16}
                color={colors.failure}
              />
            </View>
          </BaseButton>
        )}
      </View>
    </BaseButton>
  );
}
