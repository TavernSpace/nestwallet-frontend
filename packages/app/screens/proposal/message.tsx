import { walletMessageProposalType } from '../../features/proposal/utils';
import { IWallet } from '../../graphql/client/generated/graphql';

interface MessageProposalQueryProps {
  proposalId: string;
  wallet: IWallet;
}

export function MessageProposalWithQuery(props: MessageProposalQueryProps) {
  const { wallet } = props;
  const messageProposalType = walletMessageProposalType(wallet);
  return null;
}
