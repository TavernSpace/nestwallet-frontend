import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import {
  IWallet,
  IWalletDeploymentStatus,
  IWalletType,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { NftDetailsWithQuery } from '@nestwallet/app/screens/nft-details/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useSignerById } from '../../../hooks/signer';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'nftDetails'>;

export const NftDetailsWithData = withUserContext(_NftDetailsWithData);

function _NftDetailsWithData({ route }: RouteProps) {
  const { nft, walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { signer } = useSignerById(walletId);
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

  const handlePressSend = (wallet: IWallet) => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferAsset',
        params: {
          walletId: wallet.id,
          initialAsset: nft,
        },
      },
    });
  };

  const canTransact =
    !!wallet &&
    ((wallet.type === IWalletType.Safe &&
      wallet.deploymentStatus === IWalletDeploymentStatus.Deployed) ||
      !!signer?.hasKeyring);

  return wallet ? (
    <NftDetailsWithQuery
      nft={nft}
      hideActions={!canTransact}
      onPressSend={() => handlePressSend(wallet)}
    />
  ) : null;
}
