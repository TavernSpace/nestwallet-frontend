import { AssetTransfer } from '@nestwallet/app/common/types';
import {
  IOrganization,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { EoaTransferReviewWithQuery } from '@nestwallet/app/screens/transfer/review/external/query';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../../../../provider/application';
import { useUserContext } from '../../../../../provider/user';

export function EoaTransferReviewWithData(props: {
  wallet: IWallet;
  transfer: AssetTransfer;
  organization: IOrganization;
}) {
  const { wallet, transfer, organization } = props;
  const { walletService } = useAppContext();
  const { signers } = useUserContext();
  const navigation = useNavigation();

  const handleCompleted = () => {
    navigation.getParent()?.goBack();
  };

  return (
    <EoaTransferReviewWithQuery
      transfer={transfer}
      wallet={wallet}
      client={walletService}
      organization={organization}
      signers={signers}
      onCompleted={handleCompleted}
    />
  );
}
