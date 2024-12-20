import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { AssetTransfer } from '@nestwallet/app/common/types';
import { TransferAssetForm } from '@nestwallet/app/screens/transfer/form/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { useWalletById } from '../../../../hooks/wallet';
import { WalletStackParamList } from '../../../../navigation/types';
import { parsePayload } from '../../../../navigation/utils';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<WalletStackParamList, 'transferAsset'>;
type RouteParams = RouteProps['route']['params'];

export const TransferAssetWithData = withUserContext(_TransferAssetWithData);

function _TransferAssetWithData({ route }: RouteProps) {
  const {
    initialAsset,
    walletId,
    transfers = [],
  } = parsePayload<RouteParams>(route.params);
  const { wallet } = useWalletById(walletId);
  const { wallets } = useUserContext();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

  // if we were redirected here from popup, close tab when done
  const isRedirectedFromPopup = !!route.params.payload;

  const [reset, setReset] = useState(false);
  const [iteration, setIteration] = useState(0);

  useEffect(() => {
    const currentIteration = transfers?.length ?? 0;
    if (currentIteration !== iteration) {
      setIteration(currentIteration);
      setReset(true);
      setTimeout(() => setReset(false), 0);
    }
  }, [transfers?.length]);

  const handleAddTransfer = async (transfer: AssetTransfer) => {
    const newTransfers = transfers.slice();
    newTransfers.push(transfer);
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferReview',
        params: {
          walletId: wallet!.id,
          transfers: newTransfers,
          isRedirectedFromPopup,
        },
      },
    });
  };

  return wallet && !reset ? (
    <TransferAssetForm
      wallet={wallet}
      wallets={wallets}
      initialAsset={initialAsset}
      transfers={transfers}
      onAddTransfer={handleAddTransfer}
    />
  ) : null;
}
