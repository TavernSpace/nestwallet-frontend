import { useEoaMessageProposalContext } from '../../../../provider/eoa-message-proposal';
import { EoaMessageProposalScreen } from './screen';

export function EoaMessageProposalWithData() {
  const { message } = useEoaMessageProposalContext();
  return <EoaMessageProposalScreen message={message} />;
}
