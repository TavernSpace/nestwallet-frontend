import { ISignerWallet, RecipientAccount } from '../../../../common/types';
import { loadDataFromQuery } from '../../../../common/utils/query';
import {
  IBlockchainType,
  IContact,
  IOrganization,
  IWallet,
  useContactsQuery,
} from '../../../../graphql/client/generated/graphql';
import { CreateSafeSelectSignersScreen } from './screen';

interface CreateSafeSelectSignersQueryProps {
  organization: IOrganization;
  safes: IWallet[];
  signers: ISignerWallet[];
  onSelectSigners: (signers: RecipientAccount[]) => void;
  onToggleLock?: (enabled: boolean) => void;
}

export function CreateSafeSelectSignersWithQuery(
  props: CreateSafeSelectSignersQueryProps,
) {
  const { organization } = props;

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
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  return (
    <CreateSafeSelectSignersScreen {...props} contacts={contacts.data ?? []} />
  );
}
