import { parseOrigin } from '../../../../common/utils/origin';
import { ScrollWrapper } from '../../../../components/scroll';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import {
  IEthKeyMessageProposal,
  ISvmKeyMessageProposal,
} from '../../../../graphql/client/generated/graphql';
import {
  GeneralInfoCard,
  MessageCard,
} from '../../../../molecules/transaction/card';

interface EoaMessageProposalScreenProps {
  message: IEthKeyMessageProposal | ISvmKeyMessageProposal;
}

// Note this screen can currently only be accessed as history, so no
// signing is currently required
export function EoaMessageProposalScreen(props: EoaMessageProposalScreenProps) {
  const { message } = props;
  const origin = parseOrigin(message);

  return (
    <ScrollWrapper>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <View className='flex flex-col space-y-3'>
          <GeneralInfoCard
            className='mx-4'
            origin={origin}
            wallet={message.wallet}
            type='history'
            startDate={message.timestamp}
          />
          <MessageCard
            className='mx-4'
            message={message.message}
            messageType={message.type}
            type='history'
          />
        </View>
      </ViewWithInset>
    </ScrollWrapper>
  );
}
