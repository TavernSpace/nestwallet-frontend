import { faExclamation } from '@fortawesome/pro-solid-svg-icons';
import { colors } from '../../design/constants';
import { GenericSimulationInfo } from '../simulation/skeletons';

export function FailureAction(props: {
  message: string;
  isSimulation: boolean;
}) {
  const { message, isSimulation } = props;

  return (
    <GenericSimulationInfo
      title={
        isSimulation
          ? 'Transaction will likely fail on chain'
          : 'Transaction has failed on chain'
      }
      body={message}
      icon={faExclamation}
      iconColor={colors.textPrimary}
      iconBackgroundColor={colors.failure}
      size='large'
    />
  );
}
