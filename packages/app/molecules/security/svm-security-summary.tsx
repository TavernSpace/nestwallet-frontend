import { PublicKey } from '@solana/web3.js';
import { tuple } from '../../common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  onLoadable,
} from '../../common/utils/query';
import { View } from '../../components/view';
import { ChainId } from '../../features/chain';
import {
  useMultipleParsedAccountsQuery,
  useRugCheckReportQuery,
} from '../../features/security-report/query';
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
  calculateMarketCap,
  calculateSvmAveragePrice,
  calculateSvmLpLockedPercentage,
  filterUniqueRisks,
} from './utils';

interface ParsedAccountData {
  info: Info;
  type: string;
}

interface Info {
  isNative: boolean;
  mint: string;
  owner: string;
  state: string;
  tokenAmount: TokenAmount;
}

interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

export function SvmSecuritySummary(props: { token: ICryptoBalance }) {
  const { token } = props;

  const rugCheckReportQuery = useRugCheckReportQuery(
    { tokenAddress: token?.address },
    { staleTime: 1000 * 60 * 5 },
  );
  const rugCheckReport = loadDataFromQuery(rugCheckReportQuery);

  const tokenAccounts = rugCheckReport.data?.topHolders?.map(
    (holder) => new PublicKey(holder.address),
  );
  const multipleParsedAccountsQuery = useMultipleParsedAccountsQuery(
    tokenAccounts ?? [],
  );
  const multipleParsedAccounts = loadDataFromQuery(multipleParsedAccountsQuery);

  return onLoadable(
    composeLoadables(rugCheckReport, multipleParsedAccounts)(tuple),
  )(
    () => <SecuritySkeleton />,
    () => <SecurityReportPillError />,
    ([rugCheckReport, multipleParsedAccounts]) => {
      if (
        !rugCheckReport ||
        !rugCheckReport.token ||
        !rugCheckReport.topHolders
      ) {
        return <SecurityReportPillError />;
      }

      const holders = rugCheckReport.topHolders.map((holder, index) => {
        const holderWithAccount = { ...holder };
        const accountInfo = multipleParsedAccounts.value[index];
        if (accountInfo && !Buffer.isBuffer(accountInfo.data)) {
          holderWithAccount.address = (
            accountInfo.data.parsed as ParsedAccountData
          ).info.owner;
        }
        return holderWithAccount;
      });

      const lpLockedPercentage = calculateSvmLpLockedPercentage(
        rugCheckReport.markets,
      );
      const averagePrice = calculateSvmAveragePrice(
        rugCheckReport.markets,
        token.address,
      );
      const marketCap = calculateMarketCap(
        averagePrice,
        rugCheckReport.token.supply,
        rugCheckReport.token.decimals,
      );
      const risks = filterUniqueRisks(rugCheckReport.risks ?? []);

      return (
        <View className='flex space-y-3 px-4 pb-3'>
          <RiskPill score={rugCheckReport.score} />
          <RiskAnalysisCard score={rugCheckReport.score} risks={risks} />
          <TokenOverviewCard
            creator={rugCheckReport.tokenMeta?.updateAuthority}
            blockchain={IBlockchainType.Svm}
            mintAuthority={rugCheckReport.token?.mintAuthority ?? undefined}
            marketCap={marketCap}
            token={token}
            lpLocked={lpLockedPercentage}
          />
          <TopHolderCard
            holders={holders}
            blockchain={IBlockchainType.Svm}
            chainId={ChainId.Solana}
          />
        </View>
      );
    },
  );
}
