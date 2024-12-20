import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { walletMessageProposalType } from '@nestwallet/app/features/proposal/utils';
import { IMessageProposalType } from '@nestwallet/app/graphql/client/generated/graphql';
import { EoaMessageProposalContextProvider } from '@nestwallet/app/provider/eoa-message-proposal';
import { SafeMessageProposalContextProvider } from '@nestwallet/app/provider/safe-message-proposal';
import { EoaMessageProposalWithData } from '@nestwallet/app/screens/proposal/evm-key/message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';
import { SafeMessageProposalWithData } from './safe/message';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'messageProposal'>;

export const MessageProposalWithData = withUserContext(
  _MessageProposalWithData,
);

function _MessageProposalWithData(props: RouteProps) {
  const { messageId, dappData, walletId } = props.route.params;
  const { wallet } = useWalletById(walletId);
  useResetToOnInvalid('app', !wallet);

  const messageType = wallet && walletMessageProposalType(wallet);

  if (messageType === IMessageProposalType.Safe) {
    return (
      <SafeMessageProposalContextProvider
        messageId={messageId}
        isDapp={!!dappData}
      >
        <SafeMessageProposalWithData {...props} />
      </SafeMessageProposalContextProvider>
    );
  } else if (
    messageType === IMessageProposalType.EthKey ||
    messageType === IMessageProposalType.SvmKey
  ) {
    return (
      <EoaMessageProposalContextProvider
        messageType={messageType}
        messageId={messageId}
        isDapp={!!dappData}
      >
        <EoaMessageProposalWithData />
      </EoaMessageProposalContextProvider>
    );
  } else {
    return null;
  }
}
