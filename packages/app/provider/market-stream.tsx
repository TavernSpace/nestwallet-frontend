import { DateTime } from 'luxon';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { NestWalletClient } from '../common/api/nestwallet/client';
import { fetchGraphql } from '../common/hooks/graphql';
import { Nullable, Resolution } from '../common/types';
import { empty } from '../common/utils/functions';
import { ChainId, getChainInfo } from '../features/chain';
import {
  ICryptoBalance,
  IOhlcItem,
  IRealTimeTokenTradeData,
  IRecentTokenTradesV2Query,
  IRecentTokenTradesV2QueryVariables,
  ITokenChartOhlcDataV2,
  ITokenChartOhlcDataV2Query,
  ITokenChartOhlcDataV2QueryVariables,
  RecentTokenTradesV2Document,
  TokenChartOhlcDataV2Document,
  TokenTradesDocument,
} from '../graphql/client/generated/graphql';
import { useNestWallet } from './nestwallet';

interface IMarketStreamContext {
  stream: MarketStreamMultiplex;
}

export const MarketStreamContext = createContext<IMarketStreamContext>(
  {} as any,
);

export function MarketStreamContextProvider(props: {
  asset: ICryptoBalance;
  children: React.ReactNode;
}) {
  const { asset, children } = props;
  const { apiClient } = useNestWallet();

  const initializedRef = useRef(false);

  const context: IMarketStreamContext = useMemo(() => {
    return {
      stream: new MarketStreamMultiplex(
        apiClient,
        asset.address,
        asset.chainId,
      ),
    };
  }, []);

  useEffect(() => {
    // This can only happen due to dexscreener etc. integration
    if (Platform.OS !== 'web') {
      return;
    } else if (initializedRef.current) {
      context.stream.reset(asset.address, asset.chainId);
    } else {
      initializedRef.current = true;
    }
  }, [asset.address, asset.chainId]);

  useEffect(() => {
    return () => {
      context.stream.kill();
    };
  }, []);

  return (
    <MarketStreamContext.Provider value={context}>
      {children}
    </MarketStreamContext.Provider>
  );
}

export function useMarketStreamContext() {
  return useContext(MarketStreamContext);
}

class MarketStreamMultiplex {
  private stream: MarketDataStream;

  constructor(
    private client: NestWalletClient,
    private address: string,
    private chainId: number,
  ) {
    this.stream = new MarketDataStream(client, address, chainId);
  }

  public reset(address: string, chainId: number) {
    this.stream.kill();
    this.stream = new MarketDataStream(this.client, address, chainId);
  }

  public allOhlc(resolution: Resolution) {
    return this.stream.allOhlc(resolution);
  }

  public newOhlc(resolution: Resolution) {
    return this.stream.newOhlc(resolution);
  }

  public newTrades() {
    return this.stream.newTrades();
  }

  public livePrice() {
    return this.stream.livePrice();
  }

  public initialDate(resolution: Resolution) {
    return this.stream.initialDate(resolution);
  }

  public positive(resolution: Resolution) {
    return this.stream.positive(resolution);
  }

  public async populateOhlc(resolution: Resolution) {
    const address = this.address;
    const chainId = this.chainId;
    const result = await this.stream.populateOhlc(resolution);
    if (address !== this.address || chainId !== this.chainId) {
      throw new Error('Invalid token');
    } else {
      return result;
    }
  }

  public kill() {
    this.stream.kill();
  }
}

class MarketDataStream {
  private ohlc: Record<Resolution, IOhlcItem[]>;
  private trades: IRealTimeTokenTradeData[];
  private price: number;
  private initialized: boolean;
  private error: boolean;
  private destructor: VoidFunction;

  private resolutionDivisor: Record<Resolution, number> = {
    '1s': 1,
    '1': 60,
    '5': 300,
    '15': 900,
    '60': 3600,
    '1D': 86400,
    '7D': 604800,
  };
  private resolutionFinality: Record<Resolution, boolean> = {
    '1s': false,
    '1': false,
    '5': false,
    '15': false,
    '60': false,
    '1D': false,
    '7D': false,
  };
  private resolutionTime: Record<Resolution, number> = {
    '1s': 0,
    '1': 0,
    '5': 0,
    '15': 0,
    '60': 0,
    '1D': 0,
    '7D': 0,
  };
  private resolutionPromise: Record<
    Resolution,
    Nullable<Promise<IOhlcItem[]>>
  > = {
    '1s': null,
    '1': null,
    '5': null,
    '15': null,
    '60': null,
    '1D': null,
    '7D': null,
  };
  private ohlcAvailable: Record<Resolution, boolean> = {
    '1s': false,
    '1': false,
    '5': false,
    '15': false,
    '60': false,
    '1D': false,
    '7D': false,
  };
  private tradeAvailable: boolean = true;
  private locked: boolean = false;

  constructor(
    private client: NestWalletClient,
    private address: string,
    private chainId: number,
  ) {
    this.ohlc = {
      '1s': [],
      '1': [],
      '5': [],
      '15': [],
      '60': [],
      '1D': [],
      '7D': [],
    };
    this.trades = [];
    this.price = 0;
    this.error = false;
    this.initialized = false;
    this.destructor = this.validate() ? this.live() : empty;
    this.initializeTrades();
  }

  public allOhlc(resolution: Resolution) {
    const ohlc = this.ohlc[resolution];
    if (ohlc.length > 0) {
      this.ohlcAvailable[resolution] = false;
      this.resolutionTime[resolution] = ohlc[ohlc.length - 1]!.timestamp;
    }
    return [...ohlc];
  }

  // TODO: optimize this
  public newOhlc(resolution: Resolution) {
    if (this.resolutionTime[resolution] === 0 || !this.ohlcAvailable) return [];
    this.ohlcAvailable[resolution] = false;
    const ohlc = this.ohlc[resolution];
    const validOhlc = ohlc.filter(
      (data) => data.timestamp >= this.resolutionTime[resolution],
    );
    if (ohlc.length > 0) {
      this.resolutionTime[resolution] = ohlc[ohlc.length - 1]!.timestamp;
    }
    return validOhlc;
  }

  // TODO: optimize this
  public newTrades() {
    if (this.tradeAvailable) {
      this.tradeAvailable = false;
      return this.trades.slice();
    } else {
      return this.trades;
    }
  }

  public livePrice() {
    return this.price;
  }

  public percentage(resolution: Resolution) {
    const ohlc = this.ohlc[resolution];
    return ohlc.length < 2
      ? 0
      : ohlc[0]!.close === 0
      ? 0
      : ohlc[ohlc.length - 1]!.close / ohlc[0]!.close - 1;
  }

  public initialDate(resolution: Resolution) {
    const ohlc = this.ohlc[resolution];
    return ohlc[0]?.timestamp;
  }

  public positive(resolution: Resolution) {
    const ohlc = this.ohlc[resolution];
    return ohlc.length < 2
      ? true
      : ohlc[ohlc.length - 1]!.close >= ohlc[0]!.close;
  }

  public async populateOhlc(resolution: Resolution) {
    if (this.resolutionPromise[resolution]) {
      return this.resolutionPromise[resolution]!;
    } else {
      this.lock();
      const mutation = this._populateOhlc(resolution);
      this.resolutionPromise[resolution] = mutation;
      const ohlc = await mutation.finally(() => {
        this.resolutionPromise[resolution] = null;
        this.unlock();
      });
      return ohlc;
    }
  }

  public kill() {
    this.destructor();
  }

  // TODO: add caching
  private async initializeTrades() {
    try {
      this.initialized = true;
      const trades = await fetchGraphql<
        IRecentTokenTradesV2Query,
        IRecentTokenTradesV2QueryVariables
      >(this.client, RecentTokenTradesV2Document, {
        input: {
          address: this.address,
          chainId: this.chainId,
          limit: 100,
        },
      });
      this.trades = trades.recentTokenTradesV2 as IRealTimeTokenTradeData[];
    } catch {
      this.error = true;
    } finally {
      this.initialized = true;
    }
  }

  private live() {
    const target = this;
    const unsub = this.client
      .wss({
        retryAttempts: 10,
        shouldRetry: () => true,
      })
      .subscribe<Record<string, IRealTimeTokenTradeData>>(
        {
          query: TokenTradesDocument,
          variables: {
            input: {
              address: this.address,
              chainId: this.chainId,
            },
          },
        },
        {
          next(data) {
            if (data.data && data.data.tokenTrades) {
              target.addTrade(data.data.tokenTrades);
            }
          },
          error(err) {
            target.error = true;
          },
          complete() {},
        },
      );
    return () => {
      unsub();
    };
  }

  // TODO: add caching?
  private async _populateOhlc(resolution: Resolution) {
    if (this.resolutionFinality[resolution]) {
      return this.allOhlc(resolution);
    }
    const ohlc = await fetchGraphql<
      ITokenChartOhlcDataV2Query,
      ITokenChartOhlcDataV2QueryVariables
    >(this.client, TokenChartOhlcDataV2Document, {
      input: {
        address: this.address,
        chainId: this.chainId,
        interval: resolution === '1s' ? '1S' : resolution,
        toTime:
          this.ohlc[resolution].length === 0
            ? DateTime.now().toUnixInteger()
            : this.ohlc[resolution][0]!.timestamp,
        limit: 1500,
      },
    });
    const data = ohlc.tokenChartOHLCDataV2 as ITokenChartOhlcDataV2;
    this.ohlc[resolution] = [...data.data, ...this.ohlc[resolution]];
    this.resolutionFinality[resolution] = data.final;
    if (this.ohlc[resolution].length > 0) {
      this.price =
        this.ohlc[resolution][this.ohlc[resolution].length - 1]!.close;
    }
    return this.allOhlc(resolution);
  }

  private addTrade(trade: IRealTimeTokenTradeData) {
    const anomalyFactor = 1000;
    if (!this.initialized || this.locked) {
      return;
    } else if (trade.priceUSD * trade.tokenAmount < 1) {
      return;
    } else if (
      this.price !== 0 &&
      trade.priceUSD > this.price * anomalyFactor
    ) {
      return;
    } else if (trade.priceUSD * anomalyFactor < this.price) {
      return;
    } else if (this.trades.length === 0) {
      this.lock();
      this.trades.push(trade);
      this.tradeAvailable = true;
      this.addOhlc(trade);
      this.unlock();
    } else if (
      parseInt(this.trades[this.trades.length - 1]!.date) <=
      parseInt(trade.date)
    ) {
      this.lock();
      this.trades.push(trade);
      this.tradeAvailable = true;
      this.addOhlc(trade);
      this.unlock();
    }
  }

  // TODO: put this somewhere for live
  private addOhlc(trade: IRealTimeTokenTradeData) {
    Object.keys(this.ohlc).map((key) => {
      const resolution = key as Resolution;
      const ohlc = this.ohlc[resolution]!;
      // Note: we only populate if we have previously initialized the resolution
      if (ohlc.length === 0) return;
      if (ohlc[ohlc.length - 1]!.timestamp > parseInt(trade.date)) return;
      this.ohlcAvailable[resolution] = true;
      const newOhlc = this.mergeOhlc(ohlc.pop()!, trade, resolution);
      ohlc.push(...newOhlc);
    });
  }

  private mergeOhlc(
    ohlc: IOhlcItem,
    trade: IRealTimeTokenTradeData,
    resolution: Resolution,
  ): IOhlcItem[] {
    const divisor = this.resolutionDivisor[resolution];
    const timestamp = parseInt(trade.date);
    const oldTime = Math.floor(ohlc.timestamp / divisor);
    const newTime = Math.floor(timestamp / divisor);
    if (ohlc.timestamp > timestamp) {
      return [ohlc];
    } else if (oldTime === newTime) {
      const newOhlc = { ...ohlc };
      newOhlc.close = trade.priceUSD;
      newOhlc.high = Math.max(trade.priceUSD, ohlc.high);
      newOhlc.low = Math.min(trade.priceUSD, ohlc.low);
      newOhlc.volume = trade.priceUSD * trade.tokenAmount + ohlc.volume;
      this.price = trade.priceUSD;
      return [newOhlc];
    } else if (oldTime < newTime) {
      this.price = trade.priceUSD;
      return [
        ohlc,
        {
          open: ohlc.close,
          low: Math.min(trade.priceUSD, ohlc.close),
          high: Math.max(trade.priceUSD, ohlc.close),
          close: trade.priceUSD,
          volume: trade.priceUSD * trade.tokenAmount,
          timestamp,
        },
      ];
    } else {
      return [ohlc];
    }
  }

  private validate() {
    if (this.chainId !== ChainId.Solana) return false;
    const chainInfo = getChainInfo(this.chainId);
    const isCommon = chainInfo.stablecoins.some(
      (coin) => coin.address === this.address,
    );
    return !isCommon;
  }

  private lock() {
    this.locked = true;
  }

  private unlock() {
    this.locked = false;
  }
}
