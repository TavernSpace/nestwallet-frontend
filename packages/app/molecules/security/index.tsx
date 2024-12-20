import { StyledProps, styled } from 'nativewind';
import { memo } from 'react';
import { ViewStyle } from 'react-native';
import { View } from '../../components/view';
import { ChainId, getChainInfo } from '../../features/chain';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';
import { SecurityReportPillError } from './components';
import { EmptySecurityState } from './empty';
import { EvmSecuritySummary } from './evm-security-summary';
import { SvmSecuritySummary } from './svm-security-summary';

export const SecurityReport = memo(
  styled(function (props: {
    token: ICryptoBalance;
    style?: StyledProps<ViewStyle>;
  }) {
    const { token, style } = props;

    const chainInfo = getChainInfo(token.chainId);
    const isCommon =
      token.tokenMetadata.isNativeToken ||
      chainInfo.wrappedToken.address === token.address ||
      chainInfo.stablecoins.some((coin) => coin.address === token.address);

    return isCommon ? (
      <View className='px-4' style={style}>
        <EmptySecurityState />
      </View>
    ) : token.chainId === ChainId.Ton ? (
      <View style={style}>
        <SecurityReportPillError />
      </View>
    ) : token.chainId === ChainId.Solana ? (
      <View style={style}>
        <SvmSecuritySummary token={token} />
      </View>
    ) : (
      <View style={style}>
        <EvmSecuritySummary token={token} />
      </View>
    );
  }),
);
