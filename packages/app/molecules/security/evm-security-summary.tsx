import { loadDataFromQuery, onLoadable } from '../../common/utils/query';
import { View } from '../../components/view';
import { useEvmGoPlusReportQuery } from '../../features/security-report/query';
import {
  IBlockchainType,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';
import { RiskAnalysisCard, TokenOverviewCard, TopHolderCard } from './card';
import {
  RiskPill,
  SecurityReportPillError,
  SecuritySkeleton,
} from './components';
import {
  calculateEvmLpLockedPercentage,
  calculateMarketCap,
  generateRiskScoreAndFlags,
} from './utils';

export function EvmSecuritySummary(props: { token: ICryptoBalance }) {
  const { token } = props;

  const evmGoPlusReportQuery = useEvmGoPlusReportQuery(
    { tokenAddress: token?.address, chainId: token?.chainId.toString() },
    { staleTime: 1000 * 60 * 5 },
  );

  const evmGoPlusReport = loadDataFromQuery(evmGoPlusReportQuery);

  return onLoadable(evmGoPlusReport)(
    () => <SecuritySkeleton />,
    () => <SecurityReportPillError />,
    (evmGoPlusReport) => {
      if (!evmGoPlusReport) {
        return <SecurityReportPillError />;
      }
      const { score, flags } = generateRiskScoreAndFlags(
        evmGoPlusReport.holders ?? [],
        evmGoPlusReport,
      );
      const lpLockedPercentage = calculateEvmLpLockedPercentage(
        evmGoPlusReport.lp_holders,
      );
      const marketCap = calculateMarketCap(
        parseFloat(token.tokenMetadata.price),
        parseFloat(evmGoPlusReport.total_supply),
      );

      return (
        <View className='flex space-y-3 px-4 pb-3'>
          <RiskPill score={score} />
          <RiskAnalysisCard score={score} risks={flags} />
          <TokenOverviewCard
            creator={evmGoPlusReport.creator_address}
            blockchain={IBlockchainType.Evm}
            marketCap={marketCap}
            totalSupply={evmGoPlusReport.total_supply}
            token={token}
            lpLocked={lpLockedPercentage}
          />
          {evmGoPlusReport.holders && evmGoPlusReport.holders.length > 0 && (
            <TopHolderCard
              holders={evmGoPlusReport.holders}
              blockchain={IBlockchainType.Evm}
              chainId={token.chainId}
            />
          )}
        </View>
      );
    },
  );
}
