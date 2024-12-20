import { faHexagonVerticalNft } from '@fortawesome/pro-solid-svg-icons';
import _ from 'lodash';
import { useState } from 'react';
import { colors } from '../../../design/constants';
import { getChainInfo } from '../../../features/chain';
import { FontAwesomeIcon } from '../../font-awesome-icon';
import { Image } from '../../image';
import { View } from '../../view';
import { ChainAvatar } from '../chain-avatar';

interface INFTAvatarProps {
  url?: string;
  chainId?: number;
  size: number;
  borderRadius?: number;
}

export function NFTAvatar(props: INFTAvatarProps) {
  const { url, chainId, size, borderRadius = 6 } = props;

  const [error, setError] = useState(false);
  const chainInfo = chainId ? getChainInfo(chainId) : undefined;

  if (!_.isEmpty(url) && !error) {
    return (
      <View className='text-text-primary bg-inherit'>
        <Image
          source={{ uri: url }}
          style={{
            width: size,
            height: size,
            backgroundColor: 'transparent',
            borderRadius: borderRadius,
          }}
          onError={() => setError(true)}
        />
        {chainInfo && (
          <View className='absolute -bottom-1.5 -right-1.5 rounded-full'>
            <ChainAvatar chainInfo={chainInfo} size={14} border={true} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View
      className='bg-card-highlight-secondary flex items-center justify-center'
      style={{ width: size, height: size, borderRadius: borderRadius }}
    >
      <FontAwesomeIcon
        icon={faHexagonVerticalNft}
        size={size / 2}
        style={{
          color: colors.textSecondary,
        }}
      />
      {chainInfo && (
        <View className='absolute -bottom-0.5 -right-0.5 rounded-full'>
          <ChainAvatar chainInfo={chainInfo} size={14} border={true} />
        </View>
      )}
    </View>
  );
}
