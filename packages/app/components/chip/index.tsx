import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity } from '../../common/utils/functions';
import { colors } from '../../design/constants';
import { getChainInfo, onBlockchain } from '../../features/chain';
import { IBlockchainType } from '../../graphql/client/generated/graphql';
import { Text } from '../text';
import { View } from '../view';

export type ChainChipProps = {
  chainId: number;
  style?: StyleProp<ViewStyle>;
};

export const ChainChip = styled(function (props: ChainChipProps) {
  const { chainId, style } = props;

  const chainInfo = chainId ? getChainInfo(chainId) : undefined;

  return chainInfo ? (
    <View
      style={[style, { backgroundColor: opacity(chainInfo.color, 10) }]}
      className='flex w-fit flex-col items-center justify-center rounded-full px-2 py-1'
    >
      <Text
        style={{
          color: chainInfo.color,
        }}
        className='text-xs font-medium'
      >
        {chainInfo.name}
      </Text>
    </View>
  ) : (
    <View className='bg-failure/10 flex w-fit flex-col items-center justify-center rounded-full px-2 py-1'>
      <Text className='text-failure text-xs font-medium'>
        {'Wrong Network'}
      </Text>
    </View>
  );
});

export type BlockchainChipProps = {
  blockchain: IBlockchainType;
  style?: StyleProp<ViewStyle>;
};

export const BlockchainChip = styled(function (props: BlockchainChipProps) {
  const { blockchain, style } = props;

  const color = onBlockchain(blockchain)(
    () => colors.evm,
    () => colors.solana,
    () => colors.ton,
  );
  const name = onBlockchain(blockchain)(
    () => 'Ethereum',
    () => 'Solana',
    () => 'TON',
  );

  return (
    <View
      style={[style, { backgroundColor: opacity(color, 10) }]}
      className='flex w-fit flex-col items-center justify-center rounded-full px-2 py-1'
    >
      <Text
        style={{
          color,
        }}
        className='text-xs font-medium'
      >
        {name}
      </Text>
    </View>
  );
});
