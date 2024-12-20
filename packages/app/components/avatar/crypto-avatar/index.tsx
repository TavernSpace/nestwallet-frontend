import { faQuestion } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isEmpty } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { adjust } from '../../../common/utils/style';
import { colors } from '../../../design/constants';
import { getChainInfo } from '../../../features/chain';
import { ICryptoBalance } from '../../../graphql/client/generated/graphql';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Image } from '../../image';
import { Text } from '../../text';
import { View } from '../../view';
import { ChainAvatar } from '../chain-avatar';
import { GroupChainAvatar } from '../chain-avatar/group';

interface ICryptoAvatarProps {
  url?: string;
  chainId?: number;
  chainBorderColor?: string;
  tokens?: ICryptoBalance[];
  symbol: string;
  size: number;
  style?: StyleProp<ViewStyle>;
  symbolAdjustment?: number;
}

export const CryptoAvatar = styled(function (props: ICryptoAvatarProps) {
  const {
    url,
    chainId,
    chainBorderColor,
    tokens,
    symbol,
    size,
    symbolAdjustment,
    style,
  } = props;

  const [error, setError] = useState(false);

  const chainInfo = chainId ? getChainInfo(chainId) : undefined;
  const chainSize = adjust(
    size >= 48 ? 18 : size > 40 ? 16 : size > 28 ? 14 : 12,
    2,
  );
  const empty = isEmpty(url);
  const validUrl = !empty && !!url && url.startsWith('https://');

  if (!empty && !error && validUrl) {
    return (
      <View className='bg-inherit' style={style}>
        <Image
          source={{ uri: url }}
          className='rounded-full'
          style={{ width: size, height: size, backgroundColor: 'transparent' }}
          onError={() => setError(true)}
        />
        {tokens && tokens.length > 1 ? (
          <View className='absolute -bottom-0.5 -right-0.5 rounded-full'>
            <GroupChainAvatar tokens={tokens} size={chainSize} />
          </View>
        ) : chainInfo ? (
          <View className='absolute -bottom-0.5 -right-0.5 rounded-full'>
            <ChainAvatar
              chainInfo={chainInfo}
              size={chainSize}
              border={true}
              borderColor={chainBorderColor}
            />
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={style}>
      <View
        className='items-center justify-center rounded-full'
        style={{
          backgroundColor:
            symbol === '' ? colors.cardHighlight : colorFromString(symbol),
          height: size,
          width: size,
        }}
      >
        {symbol === '' ? (
          <FontAwesomeIcon
            icon={faQuestion}
            size={adjust(12, 2)}
            color={colors.textPrimary}
          />
        ) : (
          <Text
            className={cn('text-text-primary font-normal', {
              'text-xss': size <= 30,
              'text-xs': size > 30 && size < 48,
              'text-sm': size >= 48,
            })}
            style={{ marginTop: symbolAdjustment }}
          >
            {symbol
              .substring(0, size <= 16 ? 1 : size <= adjust(24, 2) ? 2 : 3)
              .toLocaleUpperCase()}
          </Text>
        )}
      </View>
      {chainInfo && (
        <View
          className='absolute rounded-full'
          style={{
            bottom: chainSize >= adjust(14, 2) ? -2 : 0,
            right: chainSize >= adjust(14, 2) ? -2 : 0,
          }}
        >
          {tokens && tokens.length > 1 ? (
            <GroupChainAvatar tokens={tokens} size={chainSize} />
          ) : (
            <ChainAvatar
              chainInfo={chainInfo}
              size={chainSize}
              border={true}
              borderColor={chainBorderColor}
            />
          )}
        </View>
      )}
    </View>
  );
});

function colorFromString(str: string) {
  let hash = 0;
  str.split('').forEach((char) => {
    hash = char.charCodeAt(0) + ((hash << 5) - hash);
  });
  let colour = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    colour += value.toString(16).padStart(2, '0');
  }
  return colour.toUpperCase();
}
