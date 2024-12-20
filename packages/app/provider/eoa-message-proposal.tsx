import { createContext, useContext } from 'react';
import { useQueryRefetcher } from '../common/hooks/query';
import { loadDataFromQuery, onLoadable } from '../common/utils/query';
import { ActivityIndicator } from '../components/activity-indicator';
import { View } from '../components/view';
import {
  IEthKeyMessageProposal,
  IMessageProposalType,
  ISvmKeyMessageProposal,
  useMessageProposalQuery,
} from '../graphql/client/generated/graphql';
import { graphqlType } from '../graphql/types';

interface IEoaMessageProposalContext {
  message: IEthKeyMessageProposal | ISvmKeyMessageProposal;
  isDapp: boolean;
}

interface EoaMessageProposalContextProps {
  messageId: string;
  messageType: IMessageProposalType;
  isDapp: boolean;
  children: React.ReactNode;
  loadingElement?: React.ReactNode;
  errorElement?: React.ReactNode;
}

const EoaMessageProposalContext = createContext<IEoaMessageProposalContext>(
  {} as any,
);

export function EoaMessageProposalContextProvider(
  props: EoaMessageProposalContextProps,
) {
  const { messageId, messageType, isDapp, loadingElement, errorElement } =
    props;

  const messageProposalQuery = useQueryRefetcher(
    graphqlType.PendingMessage,
    useMessageProposalQuery({
      input: {
        id: messageId,
        type: messageType,
      },
    }),
  );

  const eoaMessageProposalContext = loadDataFromQuery(
    messageProposalQuery,
    (data) => ({
      message:
        messageType === IMessageProposalType.SvmKey
          ? (data.messageProposal.svmKey! as ISvmKeyMessageProposal)
          : (data.messageProposal.ethKey! as IEthKeyMessageProposal),
      isDapp,
    }),
  );

  return onLoadable(eoaMessageProposalContext)(
    () =>
      loadingElement ?? (
        <View className='flex h-full items-center justify-center'>
          <ActivityIndicator />
        </View>
      ),
    () => errorElement ?? null,
    (data) => (
      <EoaMessageProposalContext.Provider value={data}>
        {props.children}
      </EoaMessageProposalContext.Provider>
    ),
  );
}

export function useEoaMessageProposalContext() {
  return useContext(EoaMessageProposalContext);
}
