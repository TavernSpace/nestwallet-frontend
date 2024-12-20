import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { View } from '@nestwallet/app/components/view';
import { EditOperation } from '@nestwallet/app/screens/wallet/edit-signers/edit-signer-sheet/content';
import { EditWalletSignersWithQuery } from '@nestwallet/app/screens/wallet/edit-signers/query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { useWalletById } from '../../../hooks/wallet';
import { SettingsStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';
import { EditSignersSheet } from './edit-signers-sheet';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'editWalletSigners'
>;

export const EditWalletSignersWithData = withUserContext(
  _EditWalletSignersWithData,
);

function _EditWalletSignersWithData({ route }: RouteProps) {
  const { walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  useResetToOnInvalid('app', !wallet);

  const [showEditSignersSheet, setShowEditSignersSheet] = useState(false);
  const [operation, setOperation] = useState<EditOperation>();

  const handleEditSignersSheet = (op: EditOperation) => {
    setOperation(op);
    setShowEditSignersSheet(true);
  };

  const handleCloseEditSignersSheet = () => {
    setShowEditSignersSheet(false);
  };

  return wallet ? (
    <View className='h-full w-full'>
      <EditWalletSignersWithQuery
        wallet={wallet}
        onEditSignersPress={handleEditSignersSheet}
      />
      {operation && (
        <EditSignersSheet
          wallet={wallet}
          operation={operation}
          isShowing={showEditSignersSheet}
          onClose={handleCloseEditSignersSheet}
        />
      )}
    </View>
  ) : null;
}
