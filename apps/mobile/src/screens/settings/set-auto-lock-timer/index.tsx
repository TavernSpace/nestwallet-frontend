import { SetAutoLockTimerScreen } from '@nestwallet/app/screens/settings/auto-lock-timer/screen';
import { useLockContext } from '../../../provider/lock';
import { withUserContext } from '../../../provider/user/wrapper';

export const AutoLockTimerWithData = withUserContext(_AutoLockTimerWithData);

function _AutoLockTimerWithData() {
  const { setAutoLockTime, autoLockTime } = useLockContext();

  return (
    <SetAutoLockTimerScreen
      onSetAutoLockTimer={setAutoLockTime}
      currentAutoLockTime={autoLockTime}
    />
  );
}
