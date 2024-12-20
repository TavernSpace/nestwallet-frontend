import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  ICryptoBalance,
  IRealTimeTokenTradeData,
} from '../graphql/client/generated/graphql';
import { useMarketStreamContext } from './market-stream';

interface TradeData {
  trades: IRealTimeTokenTradeData[];
  price: number;
}

interface IMarketContext {
  trades: IRealTimeTokenTradeData[];
  price: number;
}

export const MarketContext = createContext<IMarketContext>({} as any);

export function MarketContextProvider(props: {
  asset: ICryptoBalance;
  children: React.ReactNode;
}) {
  const { asset, children } = props;
  const { stream } = useMarketStreamContext();

  const [tradeData, setTradeData] = useState<TradeData>({
    trades: stream.newTrades(),
    price: stream.livePrice(),
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    const handler = () => {
      const trades = stream.newTrades();
      setTradeData({
        trades,
        price: stream.livePrice(),
      });
    };
    handler();
    const interval = setInterval(handler, 1000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    } else if (initializedRef.current) {
      setTradeData({
        trades: stream.newTrades(),
        price: stream.livePrice(),
      });
    } else {
      initializedRef.current = true;
    }
  }, [asset.address, asset.chainId]);

  const context: IMarketContext = useMemo(
    () => ({
      trades: tradeData.trades,
      price: tradeData.price,
    }),
    [tradeData.price, tradeData.trades],
  );

  return (
    <MarketContext.Provider value={context}>{children}</MarketContext.Provider>
  );
}

export function useMarketContext() {
  return useContext(MarketContext);
}
