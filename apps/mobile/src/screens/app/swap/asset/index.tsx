import { ICryptoBalance } from '@nestwallet/app/graphql/client/generated/graphql';
import { SwapAssetWithQuery } from '@nestwallet/app/screens/swap/asset/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useWalletById } from '../../../../hooks/wallet';
import { WalletStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<WalletStackParamList, 'swapAsset'>;

export const SwapAssetWithData = withUserContext(_SwapAssetWithData);

function _SwapAssetWithData({ route, navigation }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);

  const handleSelectAsset = (asset: ICryptoBalance) => {
    navigation.replace('swap', {
      walletId,
      initialAsset: asset,
    });
  };

  return wallet ? (
    <SwapAssetWithQuery wallet={wallet} onSelectAsset={handleSelectAsset} />
  ) : null;
}
