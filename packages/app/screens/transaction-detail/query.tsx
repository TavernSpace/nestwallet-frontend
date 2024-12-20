import { loadDataFromQuery } from '../../common/utils/query';
import {
  IContact,
  IOrganization,
  ITransaction,
  IWallet,
  useContactsQuery,
} from '../../graphql/client/generated/graphql';
import { TransactionDetailScreen } from './screen';

interface TransactionDetailQueryProps {
  transaction: ITransaction;
  organization: IOrganization;
  wallet: IWallet;
  wallets: IWallet[];
}

export function TransactionDetailScreenWithQuery(
  props: TransactionDetailQueryProps,
) {
  const { transaction, organization, wallet, wallets } = props;

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: organization.id,
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
    <TransactionDetailScreen
      transaction={transaction}
      wallet={wallet}
      wallets={wallets}
      contacts={contacts}
    />
  );
}
