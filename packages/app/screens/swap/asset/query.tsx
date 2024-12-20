import { useMemo } from 'react';
import { mapLoadable, spreadLoadable } from '../../../common/utils/query';
import {
  getChainInfo,
  swapSupportedChainsForBlockchain,
} from '../../../features/chain';
import { getCommonOwnedTokens } from '../../../features/swap/utils';
import { useSwapCryptoBalance } from '../../../features/swap/wallet-balance';
import {
  ICryptoBalance,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { SwapAssetScreen } from './screen';

interface TransferAssetFormProps {
  wallet: IWallet;
  onSelectAsset: (asset: ICryptoBalance) => void;
}

export function SwapAssetWithQuery(props: TransferAssetFormProps) {
  const { wallet, onSelectAsset } = props;

  const cryptoBalances = useSwapCryptoBalance(wallet);
  const commonCryptoBalances = useMemo(
    () =>
      mapLoadable(cryptoBalances)((balances) =>
        swapSupportedChainsForBlockchain[wallet.blockchain]
          .flatMap((chain) => getCommonOwnedTokens(chain.id, balances))
          .sort(
            (c0, c1) =>
              parseFloat(c1.balanceInUSD) - parseFloat(c0.balanceInUSD) ||
              getChainInfo(c1.chainId).swapPriority -
                getChainInfo(c0.chainId).swapPriority,
          ),
      ),
    [wallet, ...spreadLoadable(cryptoBalances)],
  );

  return (
    <SwapAssetScreen
      wallet={wallet}
      balances={commonCryptoBalances}
      onSelectAsset={onSelectAsset}
    />
  );
}
