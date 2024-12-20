import {
  useEffectOnSuccess,
  useLoadFunction,
} from '@nestwallet/app/common/hooks/loading';
import { Loadable, Nullable } from '@nestwallet/app/common/types';
import { composeLoadables } from '@nestwallet/app/common/utils/query';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { WindowType } from '@nestwallet/app/provider/nestwallet';
import { NavigationState, getStateFromPath } from '@react-navigation/native';
import { useCallback } from 'react';
import { DimensionValue } from 'react-native';
import { v4 } from 'uuid';
import { PopupStorageKey } from '../../common/constants';
import {
  BackgroundSessionStorageKey,
  BackgroundStorageKey,
} from '../../common/constants/worker/storage';
import { QueryType } from '../../common/navigation/utils';
import {
  getLocalStorage,
  getSessionStorage,
  setLocalStorage,
  setSessionStorage,
} from '../../common/storage';

interface AppState {
  windowType: WindowType;
  initialRouteName?: 'intro' | 'app';
  initialState?: NavigationState | ReturnType<typeof getStateFromPath>;
  width: DimensionValue;
  height: DimensionValue;
  handleStateChange?: (state: NavigationState | undefined) => void;
  refetchState: (reset?: boolean) => Promise<void>;
}

const getWindowType = async () => {
  const url = new URL(document.URL);
  const queryParams = new URLSearchParams(url.search);
  const passedType = queryParams.get(QueryType.type) as Nullable<WindowType>;
  // This handles the edge case where we have the popup open while sidepanel is rendering
  const tempWindowKey = 'NEST_WINDOW_ID';
  const tempWindowValue = v4();
  (window as any)[tempWindowKey] = tempWindowValue;
  if (passedType) {
    return passedType;
  }
  const curWindow = await chrome.windows.getCurrent();
  const popupView = chrome.extension.getViews({
    type: 'popup',
    windowId: curWindow.id,
  })[0];
  if (popupView && tempWindowValue === (popupView as any)[tempWindowKey]) {
    return WindowType.popup;
  }
  const currentTab = await chrome.tabs.getCurrent();
  return currentTab ? WindowType.tab : WindowType.sidepanel;
};

function useWindowType() {
  return useLoadFunction(getWindowType);
}

// Note: it is important to use session storage instead of localStorage to save the state
// since some screens have sensitive data passed in the params
const saveRouteState = async (state: string | undefined) => {
  return setSessionStorage(BackgroundSessionStorageKey.RouteState, { state });
};

const getPersistedRouteState = async (
  reset?: boolean,
): Promise<NavigationState | null> => {
  if (reset === undefined) {
    return null;
  } else if (reset) {
    await clearPersistedRouteState();
    return null;
  } else {
    const value = await getSessionStorage(
      BackgroundSessionStorageKey.RouteState,
    );
    return value && value.state ? JSON.parse(value.state) : null;
  }
};

export const clearPersistedRouteState = async () => {
  return setSessionStorage(BackgroundSessionStorageKey.RouteState, {
    state: undefined,
  });
};

export function useExtensionStatus() {
  const setStatus = useCallback(async () => {
    const isUpdated = await getLocalStorage(BackgroundStorageKey.IsUpdated);
    return { isUpdated: !!isUpdated };
  }, []);
  return useLoadFunction(setStatus);
}

function usePersistedState(reset?: boolean) {
  const fetchState = useCallback(
    async () => getPersistedRouteState(reset),
    [reset],
  );
  return useLoadFunction(fetchState, reset === undefined);
}

function getAppStyle(type: WindowType): {
  width: DimensionValue;
  height: DimensionValue;
} {
  return type === WindowType.popup || type === WindowType.tab
    ? {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
      }
    : {
        width: '100%',
        height: '100%',
      };
}

export function useAppState(): Loadable<AppState> {
  const { data: extensionStatus } = useExtensionStatus();
  const { data: persistedState, refetch: refetchState } = usePersistedState(
    extensionStatus.data?.isUpdated,
  );
  const { data: windowType } = useWindowType();

  useEffectOnSuccess(extensionStatus, ({ isUpdated }) => {
    // reset query cache if app just updated
    if (isUpdated) {
      localStorage.removeItem(PopupStorageKey.QueryCache);
      setDoneUpdating();
    }
  });

  return composeLoadables(
    windowType,
    persistedState,
    extensionStatus,
  )((windowType, persistedState) => {
    // For testing locally windowType === WindowType.popup || windowType === WindowType.tab can be used to reload extension on same page when fullscren
    if (windowType === WindowType.popup) {
      return {
        windowType,
        initialRouteName: 'app',
        initialState: persistedState ?? undefined,
        handleStateChange: (state: NavigationState | undefined) =>
          saveRouteState(JSON.stringify(state)),
        refetchState,
        ...getAppStyle(windowType),
      };
    }
    let initialState: ReturnType<typeof getStateFromPath> | undefined;
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      const path = `${hash}${location.search}`;
      initialState = getStateFromPath(path);
    }
    return {
      windowType,
      initialState,
      refetchState,
      ...getAppStyle(windowType),
    };
  });
}

export async function setDoneUpdating() {
  await setLocalStorage(BackgroundStorageKey.IsUpdated, false);
}
