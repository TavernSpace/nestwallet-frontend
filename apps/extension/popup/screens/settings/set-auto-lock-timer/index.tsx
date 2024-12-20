import {
  loadDataFromQuery,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { SetAutoLockTimerScreen } from '@nestwallet/app/screens/settings/auto-lock-timer/screen';
import { useAutoLockTimeQuery } from '../../../hooks/ui-service';
import { useAppContext } from '../../../provider/application';
import { withUserContext } from '../../../provider/user/wrapper';

export const AutoLockTimerWithData = withUserContext(_AutoLockTimerWithData);

function _AutoLockTimerWithData() {
  const { walletService } = useAppContext();

  const autoLockTimeQuery = useAutoLockTimeQuery();
  const autoLockTime = loadDataFromQuery(autoLockTimeQuery);

  const handleAutoLockTimerSet = async (time: number) => {
    await walletService.setAutoLockTime(time);
    await walletService.resetAutoLockTimer();
    await autoLockTimeQuery.refetch();
  };

  // TODO: handle error
  return onLoadable(autoLockTime)(
    () => null,
    () => null,
    (time) => (
      <SetAutoLockTimerScreen
        onSetAutoLockTimer={handleAutoLockTimerSet}
        currentAutoLockTime={time}
      />
    ),
  );
}
