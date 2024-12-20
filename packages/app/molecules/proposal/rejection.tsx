import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { colors } from '../../design/constants';
import { GenericSimulationInfo } from '../simulation/skeletons';

export function RejectionAction(props: { nonce: number }) {
  const { nonce } = props;

  return (
    <GenericSimulationInfo
      title='On-Chain Rejection Transaction'
      body={`Replace proposals with nonce ${nonce}`}
      icon={faTimes}
      iconColor={colors.textPrimary}
      iconBackgroundColor={colors.failure}
    />
  );
}
