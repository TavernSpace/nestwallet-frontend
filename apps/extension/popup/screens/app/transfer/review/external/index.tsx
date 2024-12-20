import { AssetTransfer } from '@nestwallet/app/common/types';
import {
  IOrganization,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { EoaTransferReviewWithQuery } from '@nestwallet/app/screens/transfer/review/external/query';
import { useGoBackOrClose } from '../../../../../hooks/navigation';
import { useLockContext } from '../../../../../provider/lock';
import { useUserContext } from '../../../../../provider/user';

export function EoaTransferReviewWithData(props: {
  wallet: IWallet;
  transfer: AssetTransfer;
  organization: IOrganization;
  isRedirectedFromPopup: boolean;
}) {
  const { wallet, transfer, organization, isRedirectedFromPopup } = props;
  const { client } = useLockContext();
  const { signers } = useUserContext();

  const handleCompleted = useGoBackOrClose(!isRedirectedFromPopup);

  return (
    <EoaTransferReviewWithQuery
      transfer={transfer}
      wallet={wallet}
      client={client}
      organization={organization}
      signers={signers}
      onCompleted={handleCompleted}
    />
  );
}
