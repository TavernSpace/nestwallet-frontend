import { Loadable } from '../../../common/types';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import {
  ICryptoBalance,
  IWallet,
} from '../../../graphql/client/generated/graphql';
import { AssetSelect } from '../../../molecules/select/asset-select';

interface SwapAssetFormProps {
  wallet: IWallet;
  balances: Loadable<ICryptoBalance[]>;
  onSelectAsset: (asset: ICryptoBalance) => void;
}

export function SwapAssetScreen(props: SwapAssetFormProps) {
  const { wallet, balances, onSelectAsset } = props;

  return (
    <View className='absolute h-full w-full'>
      <ViewWithInset className='h-full w-full'>
        <AssetSelect
          blockchain={wallet.blockchain}
          cryptos={balances}
          hideNFTs={true}
          onChange={(asset) => onSelectAsset(asset as ICryptoBalance)}
        />
      </ViewWithInset>
    </View>
  );
}
