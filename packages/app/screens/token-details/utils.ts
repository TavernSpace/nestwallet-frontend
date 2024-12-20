import { getChainInfo } from '../../features/chain';
import { IRealTimeTokenTradeData } from '../../graphql/client/generated/graphql';
import { PriceData } from '../../provider/market';

export function ohlcFromTrades(trades: IRealTimeTokenTradeData[]) {}

export function tradeToPoint(trade: IRealTimeTokenTradeData) {
  return {
    timestamp: parseInt(trade.date) * 1000,
    value: trade.priceUSD,
  };
}

export function priceToPoint(price: PriceData) {
  return {
    timestamp: price.timestamp * 1000,
    value: price.price,
  };
}

export function candleSupported(chainId: number) {
  return getChainInfo(chainId).flags.isCandleSupported;
}
