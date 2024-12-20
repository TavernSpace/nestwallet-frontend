import { styled } from 'nativewind';
import { StyleProp, View, ViewStyle } from 'react-native';
import { ChainAvatar } from '..';
import { withSize } from '../../../../common/utils/style';
import { getChainInfo } from '../../../../features/chain';
import { Text } from '../../../text';

interface LayeredChainAvatarProps {
  chains: number[];
  limit?: number;
  displayRemaining?: boolean;
  size: number;
  border: boolean;
  borderColor?: string;
  overlap?: number; //Higher value means less overlap
  style?: StyleProp<ViewStyle>;
}

export const LayeredChainAvatar = styled(function (
  props: LayeredChainAvatarProps,
) {
  const {
    chains,
    limit,
    displayRemaining = false,
    size,
    border,
    borderColor,
    overlap = 0.7,
    style,
  } = props;

  const validChains = limit !== undefined ? chains.slice(0, limit) : chains;
  const sizeOffset = border ? 4 : 0;
  const staticSize = size + sizeOffset;
  const overflow = !!limit && chains.length > limit;
  const maximum = overflow && displayRemaining ? limit : chains.length - 1;
  const extendingSize = maximum * overlap * size + staticSize;

  return (
    <View
      style={[
        style,
        {
          height: staticSize,
          width: extendingSize,
        },
      ]}
    >
      {validChains.map((chain, index) => (
        <View
          className='absolute'
          key={chain}
          style={{ left: index * size * overlap }}
        >
          <ChainAvatar
            chainInfo={getChainInfo(chain)}
            size={size}
            border={border}
            borderColor={borderColor}
          />
        </View>
      ))}
      {validChains.length < chains.length && displayRemaining && (
        <View
          className='absolute'
          style={{ left: validChains.length * size * overlap }}
        >
          <View
            className='items-center justify-center rounded-full'
            style={{
              backgroundColor: borderColor ?? undefined,
              ...withSize(border ? size + 4 : size),
            }}
          >
            <View
              className='bg-card-highlight items-center justify-center rounded-full'
              style={{ ...withSize(size) }}
            >
              <Text className='text-text-secondary text-xss font-normal'>
                {`+${chains.length - validChains.length}`}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});
