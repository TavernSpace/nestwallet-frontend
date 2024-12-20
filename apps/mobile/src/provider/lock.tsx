import { useResetTo } from '@nestwallet/app/common/hooks/navigation';
import { Nullable, UserData } from '@nestwallet/app/common/types';
import {
  loadDataFromQuery,
  spreadLoadable,
} from '@nestwallet/app/common/utils/query';
import { Blur } from '@nestwallet/app/components/blur';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { useSplashContext } from '@nestwallet/app/provider/splash';
import { MobileLockScreen } from '@nestwallet/app/screens/lock/mobile-auth';
import { DateTime } from 'luxon';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, Platform } from 'react-native';
import { Portal } from 'react-native-paper';
import { FullWindowOverlay } from 'react-native-screens';
import { useAutoLockTimeQuery } from '../hooks/device';
import { useAppContext } from './application';
import { useAuthorizedUserContext } from './user/auth';

interface ILockContext {
  lock: VoidFunction;
  autoLockTime: number;
  toggleAutoLock: (enabled: boolean) => void;
  setAutoLockTime: (time: number) => Promise<void>;
}

const LockContext = createContext<ILockContext>({} as any);

export function LockContextProvider(props: {
  userData: Nullable<UserData>;
  children: React.ReactNode;
}) {
  const { userData, children } = props;
  const { walletService } = useAppContext();
  const { user, refetchSigners } = useAuthorizedUserContext();
  const { complete } = useSplashContext();
  const resetTo = useResetTo();

  const attemptedRef = useRef(false);
  const disabledRef = useRef(false);
  const timeRef = useRef<DateTime>();

  const isUnlocked = useMemo(() => {
    try {
      walletService.getUserPassword();
      return true;
    } catch {
      return false;
    }
  }, []);

  const [unlocked, setUnlocked] = useState(isUnlocked);
  const [unlocking, setUnlocking] = useState(false);
  const [blur, setBlur] = useState(false);

  const autoLockTimeQuery = useAutoLockTimeQuery();
  const autoLockTime = loadDataFromQuery(autoLockTimeQuery);

  const handleUnlock = async () => {
    try {
      attemptedRef.current = true;
      disabledRef.current = false;
      timeRef.current = undefined;
      setUnlocking(true);
      await walletService.unlock();
      setUnlocked(true);
      setBlur(false);
    } finally {
      setUnlocking(false);
    }
  };

  const handleLogout = async () => {
    await walletService.logout();
    setUnlocked(false);
    attemptedRef.current = false;
    resetTo('auth', { screen: 'login' });
  };

  const handleReset = async () => {
    await walletService.resetUserPassword();
    await refetchSigners();
  };

  const lock = () => {
    walletService.lock();
    setUnlocked(false);
  };

  const toggleAutoLock = (enabled: boolean) => {
    disabledRef.current = !enabled;
  };

  const setAutoLockTime = async (time: number) => {
    await walletService.setAutoLockTime(time);
    await autoLockTimeQuery.refetch();
  };

  useEffect(() => {
    if (!unlocked && !attemptedRef.current && userData) {
      handleUnlock();
    }
  }, [userData]);

  useEffect(() => {
    const lockTime = autoLockTime.data ?? 0;
    const subscription = AppState.addEventListener('change', (status) => {
      const curTime = DateTime.now();
      if (disabledRef.current) {
        return;
      } else if (status === 'background' && lockTime === 0) {
        attemptedRef.current = false;
        lock();
      } else if (status === 'background' && lockTime !== 0) {
        attemptedRef.current = false;
        timeRef.current = DateTime.now();
        setBlur(true);
      } else if (status === 'inactive') {
        setBlur(true);
      } else if (
        status === 'active' &&
        lockTime !== 0 &&
        unlocked &&
        timeRef.current &&
        timeRef.current.plus(lockTime * 60 * 1000) <= curTime
      ) {
        lock();
        handleUnlock();
      } else if (
        status === 'active' &&
        unlocked &&
        ((timeRef.current &&
          timeRef.current.plus(lockTime * 60 * 1000) > curTime) ||
          lockTime === 0)
      ) {
        setBlur(false);
      } else if (
        status === 'active' &&
        !attemptedRef.current &&
        !unlocked &&
        !unlocking &&
        userData
      ) {
        handleUnlock();
      } else {
        setBlur(false);
      }
    });
    return () => subscription.remove();
  }, [unlocked, unlocking, userData, ...spreadLoadable(autoLockTime)]);

  const lockContext = useMemo(
    () => ({
      lock,
      autoLockTime: autoLockTime.data ?? 0,
      toggleAutoLock,
      setAutoLockTime,
    }),
    [...spreadLoadable(autoLockTime)],
  );

  return userData ? (
    <>
      <LockContext.Provider value={lockContext}>
        <Portal.Host>{children}</Portal.Host>
      </LockContext.Provider>
      {user.data && (
        <>
          {!unlocked && Platform.OS === 'android' && (
            <Portal>
              <MobileLockScreen
                identity={userData.email || userData.name || 'My Phone'}
                unlocking={unlocking}
                onUnlock={handleUnlock}
                onLogout={handleLogout}
                onReset={handleReset}
              />
            </Portal>
          )}
          {(!unlocked || blur) &&
            Platform.OS === 'ios' &&
            (complete ? (
              <FullWindowOverlay>
                <Portal.Host>
                  {blur && (
                    <View className='absolute'>
                      <Blur intensity={48}>
                        <View
                          className='bg-card/50'
                          style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
                        />
                      </Blur>
                    </View>
                  )}
                  {!unlocked && (
                    <MobileLockScreen
                      identity={userData.email || userData.name || 'My Phone'}
                      unlocking={unlocking}
                      onUnlock={handleUnlock}
                      onLogout={handleLogout}
                      onReset={handleReset}
                    />
                  )}
                </Portal.Host>
              </FullWindowOverlay>
            ) : (
              <View
                className='bg-background absolute'
                style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}
              />
            ))}
        </>
      )}
    </>
  ) : null;
}

export function useLockContext() {
  return useContext(LockContext);
}
