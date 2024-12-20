import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { opacity, tuple } from '../../../common/utils/functions';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { Svg } from '../../svg';
import { View } from '../../view';

interface BlockchainAvatarProps {
  blockchain: IBlockchainType;
  size: number;
  border?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

export const BlockchainAvatar = styled(function (props: BlockchainAvatarProps) {
  const { blockchain, border, borderColor, size, style } = props;

  const [logoUri, color] = onBlockchain(blockchain)(
    () =>
      tuple(
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/evm-full.svg',
        colors.evm,
      ),
    () =>
      tuple(
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg',
        colors.solana,
      ),
    () =>
      tuple(
        'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ton.svg',
        colors.ton,
      ),
  );
  const borderSize = size > 12 ? 4 : 2;

  return (
    <View
      className='items-center justify-center'
      style={[
        style,
        {
          backgroundColor: border
            ? borderColor ?? colors.background
            : undefined,
          width: border ? size + borderSize : size,
          height: border ? size + borderSize : size,
          borderRadius: 9999,
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: 9999,
          backgroundColor: opacity(color, 20),
        }}
      >
        <Svg source={{ uri: logoUri }} width={size} height={size} />
      </View>
    </View>
  );
});
