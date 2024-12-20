import { loadDataFromQuery } from '../../../common/utils/query';
import { useSafeInfoQuery } from '../../../features/safe/queries';
import { IWallet } from '../../../graphql/client/generated/graphql';
import { EditOperation } from './edit-signer-sheet/content';
import { EditSafeSignersScreen } from './screen';

interface EditWalletSignersQueryProps {
  wallet: IWallet;
  onEditSignersPress: (op: EditOperation) => void;
}

export function EditWalletSignersWithQuery(props: EditWalletSignersQueryProps) {
  const { wallet, onEditSignersPress } = props;

  const safeInfoQuery = useSafeInfoQuery(wallet.chainId, wallet.address);
  const safeInfo = loadDataFromQuery(safeInfoQuery);

  return (
    <EditSafeSignersScreen
      selectedWallet={wallet}
      safeInfo={safeInfo}
      onEditSignersPress={onEditSignersPress}
    />
  );
}
