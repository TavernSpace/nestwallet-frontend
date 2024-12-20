import { ISignerWallet, VoidPromiseFunction } from '../../../common/types';
import { loadDataFromQuery } from '../../../common/utils/query';
import { RedeploySafeInput } from '../../../features/safe/types';
import {
  IBlockchainType,
  IContact,
  IWallet,
  useContactsQuery,
} from '../../../graphql/client/generated/graphql';
import { MultichainDeployExecuteScreen } from './screen';

interface MultichainDeployExecuteQueryProps {
  wallet: IWallet;
  signers: ISignerWallet[];
  input: RedeploySafeInput;
  onSubmit: VoidPromiseFunction;
}

export function MultichainDeployExecuteWithQuery(
  props: MultichainDeployExecuteQueryProps,
) {
  const { wallet, signers, input, onSubmit } = props;

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
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  return (
    <MultichainDeployExecuteScreen
      wallet={wallet}
      signers={signers}
      contacts={contacts}
      input={input}
      onSubmit={onSubmit}
    />
  );
}
