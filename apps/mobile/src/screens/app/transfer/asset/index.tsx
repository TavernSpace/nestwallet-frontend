import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { AssetTransfer } from '@nestwallet/app/common/types';
import { TransferAssetForm } from '@nestwallet/app/screens/transfer/form/query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useWalletById } from '../../../../hooks/wallet';
import { WalletStackParamList } from '../../../../navigation/types';
import { useLockContext } from '../../../../provider/lock';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<WalletStackParamList, 'transferAsset'>;

export const TransferAssetWithData = withUserContext(_TransferAssetWithData);

function _TransferAssetWithData({ route }: RouteProps) {
  const { initialAsset, walletId, transfers = [] } = route.params;
  const { wallet } = useWalletById(walletId);
  const { wallets } = useUserContext();
  const { toggleAutoLock } = useLockContext();
  const navigation = useNavigation();
  useResetToOnInvalid('app', !wallet);

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
        },
      },
    });
  };

  useEffect(() => {
    return () => toggleAutoLock(true);
  }, []);

  return wallet && !reset ? (
    <TransferAssetForm
      wallet={wallet}
      wallets={wallets}
      initialAsset={initialAsset}
      transfers={transfers}
      onAddTransfer={handleAddTransfer}
      onToggleLock={Platform.OS === 'android' ? toggleAutoLock : undefined}
    />
  ) : null;
}
