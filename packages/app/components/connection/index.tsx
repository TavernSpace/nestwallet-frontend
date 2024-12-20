import { faGlobe } from '@fortawesome/pro-light-svg-icons';
import TonConnectLogo from '@nestwallet/app/assets/images/logos/ton.svg';
import WalletConnectLogo from '@nestwallet/app/assets/images/logos/wallet-connect.svg';
import cn from 'classnames';
import { styled } from 'nativewind';
import { useEffect, useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useLoadImage } from '../../common/hooks/image';
import { adjust, withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { ConnectionType } from '../../screens/approval/types';
import { BaseButton } from '../button/base-button';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { Image } from '../image';
import { View } from '../view';

export const ConnectionIcon = styled(function (props: {
  isConnected: boolean;
  hideBadge?: boolean;
  iconUrl?: string;
  size?: number;
  borderRadius?: number;
  backgroundColor?: string;
  onPress?: VoidFunction;
  style?: StyleProp<ViewStyle>;
  connectionType?: ConnectionType;
}) {
  const {
    isConnected,
    hideBadge = false,
    iconUrl,
    onPress,
    size: customSize,
    borderRadius = 8,
    backgroundColor = colors.cardHighlight,
    style,
    connectionType = 'injection',
  } = props;

  const [loadError, setLoadError] = useState(false);
  const [image, error] = useLoadImage(iconUrl, 'https://www.google.com/s2/');

  const iconSize = customSize || adjust(20);
  const size = iconSize * 1.5;

  useEffect(() => {
    setLoadError(false);
  }, [iconUrl]);

  return (
    <View style={style}>
      <BaseButton
        pressableStyle={{ borderRadius }}
        scale={0.9}
        onPress={onPress}
        style={{ borderRadius }}
      >
        <View
          className='flex items-center justify-center'
          style={{
            ...withSize(size),
            backgroundColor: isConnected ? backgroundColor : undefined,
            borderRadius,
          }}
        >
          {!!iconUrl && isConnected && !error && !loadError && !!image ? (
            <Image
              source={{ uri: iconUrl }}
              style={{
                ...withSize(iconSize),
                borderRadius,
              }}
              onError={() => setLoadError(true)}
            />
          ) : (
            <FontAwesomeIcon
              icon={faGlobe}
              color={colors.textPrimary}
              size={iconSize}
            />
          )}
          {isConnected && !hideBadge && (
            <View
              className={cn(
                'absolute z-10 h-3 w-3 items-center justify-center rounded-full',
                {
                  'bg-background': backgroundColor === colors.card,
                  'bg-card': backgroundColor !== colors.card,
                  '-right-1 -top-1': borderRadius <= 8,
                  '-right-0.5 -top-0.5': borderRadius > 8,
                },
              )}
            >
              {connectionType === 'wc' ? (
                <Image source={WalletConnectLogo} style={withSize(12)} />
              ) : connectionType === 'tc' ? (
                <Image source={TonConnectLogo} style={withSize(12)} />
              ) : (
                <View className='bg-success h-2 w-2 rounded-full' />
              )}
            </View>
          )}
        </View>
      </BaseButton>
    </View>
  );
});
