import { ethers } from 'ethers';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { Tuple } from '../common/types';
import { cryptoKey } from '../features/crypto/utils';
import { ICryptoBalance } from '../graphql/client/generated/graphql';
import { useMarketStreamContext } from './market-stream';

interface PositionPrice {
  price: number;
  amount: number;
}

interface IPositionContext {
  pnlAt: (price: number) => Tuple<number, 2>;
}

export const PositionContext = createContext<IPositionContext>({} as any);

export function PositionContextProvider(props: {
  asset: ICryptoBalance;
  children: React.ReactNode;
}) {
  const { asset, children } = props;
  const { stream } = useMarketStreamContext();

  const positionId = cryptoKey(asset);
  const totalBalance = parseFloat(
    ethers.formatUnits(asset.balance, asset.tokenMetadata.decimals),
  );
  const averagePrice =
    asset.averagePriceUSD ?? parseFloat(asset.tokenMetadata.price);

  const [id, setId] = useState(positionId);
  const [pricePerUnit, setPricePerUnit] = useState(averagePrice);
  const [positionBalance, setPositionBalance] = useState(totalBalance);

  const context: IPositionContext = useMemo(
    () => ({
      pnlAt: (price) => {
        if (pricePerUnit && positionBalance) {
          const absolute = (price - pricePerUnit) * positionBalance;
          return [absolute, absolute / (pricePerUnit * positionBalance)];
        } else {
          return [0, 0];
        }
      },
    }),
    [pricePerUnit, positionBalance],
  );

  useEffect(() => {
    const newId = positionId;
    // This is only relevant on web because of dexscreener, etc. integration
    if (Platform.OS === 'web' && newId !== id) {
      setPricePerUnit(averagePrice);
      setPositionBalance(totalBalance);
      setId(newId);
    } else {
      const oldBalance = positionBalance;
      const newBalance = Math.max(0, totalBalance);
      const oldPpu = pricePerUnit;
      const livePrice = stream.livePrice();
      const ppu =
        livePrice !== 0 ? livePrice : parseFloat(asset.tokenMetadata.price);
      setPositionBalance(newBalance);
      if (newBalance === 0) {
        setPricePerUnit(0);
        // Sells don't affect average price
      } else if (newBalance > oldBalance) {
        setPricePerUnit(
          oldPpu === 0
            ? ppu
            : (oldPpu * oldBalance + ppu * (newBalance - oldBalance)) /
                newBalance,
        );
      }
    }
  }, [positionId, totalBalance]);

  return (
    <PositionContext.Provider value={context}>
      {children}
    </PositionContext.Provider>
  );
}

export function usePositionContext() {
  return useContext(PositionContext);
}
