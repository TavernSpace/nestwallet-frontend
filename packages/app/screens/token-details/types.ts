import {
  IChartPeriod,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';

export type ShareFunction = (
  token: ICryptoBalance,
) => (ref: React.MutableRefObject<null>) => Promise<void>;

export type TokenDetailDisplay = 'overview' | 'trades' | 'details' | 'security';

export type ChartPeriod = IChartPeriod | 'live';

export type ChartType = 'line' | 'candle';
