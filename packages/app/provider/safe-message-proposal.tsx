import { SafeInfoResponse } from '@safe-global/api-kit';
import { createContext, useContext } from 'react';
import { useQueryRefetcher } from '../common/hooks/query';
import { Loadable } from '../common/types';
import { loadDataFromQuery, onLoadable } from '../common/utils/query';
import { ActivityIndicator } from '../components/activity-indicator';
import { View } from '../components/view';
import { useSafeInfoQuery } from '../features/safe/queries';
import {
  IBlockchainType,
  IContact,
  IMessageProposalType,
  ISafeMessageProposal,
  useContactsQuery,
  useMessageProposalQuery,
} from '../graphql/client/generated/graphql';
import { graphqlType } from '../graphql/types';

interface ISafeMessageProposalContext {
  message: ISafeMessageProposal;
  isDapp: boolean;
  safeInfo: Loadable<SafeInfoResponse>;
  contacts: Loadable<IContact[]>;
}

interface SafeMessageProposalContextProps {
  messageId: string;
  isDapp: boolean;
  children: React.ReactNode;
  errorElement?: React.ReactNode;
}

const SafeMessageProposalContext = createContext<ISafeMessageProposalContext>(
  {} as any,
);

export function SafeMessageProposalContextProvider(
  props: SafeMessageProposalContextProps,
) {
  const { messageId, errorElement } = props;

  const messageQuery = useQueryRefetcher(
    graphqlType.Message,
    useMessageProposalQuery(
      {
        input: {
          id: messageId,
          type: IMessageProposalType.Safe,
        },
      },
      { refetchInterval: 1000 * 5 },
    ),
  );

  const message = loadDataFromQuery(
    messageQuery,
    (data) => data.messageProposal.safe! as ISafeMessageProposal,
  );

  return onLoadable(message)(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => errorElement ?? null,
    (message) => <MessageContextWithMessage {...props} message={message} />,
  );
}

type SafeMessageProposalContextWithSafeInfoProps =
  SafeMessageProposalContextProps & {
    message: ISafeMessageProposal;
  };

function MessageContextWithMessage(
  props: SafeMessageProposalContextWithSafeInfoProps,
) {
  const { message, isDapp } = props;

  const safeInfoQuery = useSafeInfoQuery(
    message.wallet.chainId,
    message.wallet.address,
  );
  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: message.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );

  const safeInfo = loadDataFromQuery(safeInfoQuery);
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const safeMessageProposalContext: ISafeMessageProposalContext = {
    message,
    isDapp,
    safeInfo,
    contacts,
  };

  return (
    <SafeMessageProposalContext.Provider value={safeMessageProposalContext}>
      {props.children}
    </SafeMessageProposalContext.Provider>
  );
}

export function useSafeMessageProposalContext() {
  return useContext(SafeMessageProposalContext);
}
