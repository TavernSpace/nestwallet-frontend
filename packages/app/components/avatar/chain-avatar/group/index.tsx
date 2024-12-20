import _ from 'lodash';
import PieChart from 'react-native-pie-chart';
import { withSize } from '../../../../common/utils/style';
import { colors } from '../../../../design/constants';
import { getChainInfo } from '../../../../features/chain';
import { ICryptoBalance } from '../../../../graphql/client/generated/graphql';
import { View } from '../../../view';

interface GroupChainAvatarProps {
  tokens: ICryptoBalance[];
  size: number;
}

export function GroupChainAvatar(props: GroupChainAvatarProps) {
  const { tokens, size } = props;

  const maxDecimals = Math.max(
    ...tokens.map((token) => token.tokenMetadata.decimals),
  );
  const totalBalance = tokens.reduce(
    (acc, token) =>
      acc +
      BigInt(token.balance) *
        10n ** BigInt(maxDecimals - token.tokenMetadata.decimals),
    BigInt(0),
  );

  // Adjust balances for tokens with < 5% balance. This will make the slices on the pie chart actually visable for small amounts
  const chainValues = tokens.map((token) => {
    const balance =
      BigInt(token.balance) *
      10n ** BigInt(maxDecimals - token.tokenMetadata.decimals);
    const ratio = Number((balance * 100n) / totalBalance) / 100;
    return {
      value: Math.max(0.05, ratio),
      color: getChainInfo(token.chainId).color,
    };
  });

  const series = chainValues.map((value) => value.value);
  const sliceColor = chainValues.map((value) => value.color);
  const dividerSeries = chainValues.map(() => 0.02);
  const dividerColor = chainValues.map(() => colors.background);

  return (
    <View
      className='bg-background items-center justify-center rounded-full'
      style={withSize(size + 4)}
    >
      <PieChart
        widthAndHeight={size}
        coverRadius={0.6}
        series={_.flatten(_.zip(series, dividerSeries)) as number[]}
        sliceColor={_.flatten(_.zip(sliceColor, dividerColor)) as string[]}
      />
    </View>
  );
}
