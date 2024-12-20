import { TokenDetailSettings } from '@nestwallet/app/common/types';
import { ChartType } from '@nestwallet/app/screens/token-details/types';
import { TradingViewChart } from './trading-view';

export function MobileChart(props: {
  initialChartType: ChartType;
  onSettingsChange: (settings: TokenDetailSettings) => Promise<void>;
}) {
  const { initialChartType, onSettingsChange } = props;

  return (
    <TradingViewChart
      initialChartType={initialChartType}
      onSettingsChange={onSettingsChange}
    />
  );
}
