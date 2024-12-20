import { AssetTransfer, ISignerWallet } from '../../../../common/types';
import { loadDataFromQuery } from '../../../../common/utils/query';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import {
  IContact,
  IOrganization,
  IWallet,
  useContactsQuery,
} from '../../../../graphql/client/generated/graphql';
import { useCryptoPositions } from '../../utils';
import { EoaTransferReviewScreen } from './screen';

interface EoaTransferReviewWithQueryProps {
  transfer: AssetTransfer;
  wallet: IWallet;
  client: IProtectedWalletClient;
  organization: IOrganization;
  signers: ISignerWallet[];
  onCompleted: VoidFunction;
}

export function EoaTransferReviewWithQuery(
  props: EoaTransferReviewWithQueryProps,
) {
  const { transfer, wallet, client, organization, signers, onCompleted } =
    props;

  const { cryptoBalances } = useCryptoPositions(wallet, []);

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: wallet.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) => data.contacts as IContact[],
  );

  return (
    <EoaTransferReviewScreen
      transfer={transfer}
      wallet={wallet}
      client={client}
      organization={organization}
      cryptoBalances={cryptoBalances}
      signers={signers}
      contacts={contacts}
      onCompleted={onCompleted}
    />
  );
}
