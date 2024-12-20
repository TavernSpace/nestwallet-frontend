import { VoidPromiseFunction } from '@nestwallet/app/common/types';
import { discard } from '@nestwallet/app/common/utils/functions';
import { WindowType } from '@nestwallet/app/provider/nestwallet';
import { QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { SidepanelState } from '../../common/constants';
import { SERVICE_WORKER_SIDEPANEL_CHANNEL } from '../../common/constants/worker/channel';
import { BackgroundSessionStorageKey } from '../../common/constants/worker/storage';
import { encodePayload } from '../../common/navigation/utils';
import { setSessionStorage } from '../../common/storage';
import { appendWindowId } from '../../common/utils';
import { connectedSiteQueryKey } from './ui-service';

export function useInitializeSidepanel(
  windowType: WindowType | undefined,
  queryClient: QueryClient,
  navigation: any,
) {
  const initializeSidepanel = (windowId: number) => {
    if (windowType !== WindowType.sidepanel) return () => {};
    const port = chrome.runtime.connect({
      name: appendWindowId(SERVICE_WORKER_SIDEPANEL_CHANNEL, windowId),
    });
    const interval = setInterval(() => port.postMessage('ping'), 10 * 1000);
    const activeListener = (activeInfo: chrome.tabs.TabActiveInfo) => {
      chrome.tabs.get(activeInfo.tabId, () => {
        queryClient.invalidateQueries({ queryKey: connectedSiteQueryKey() });
      });
    };
    const updateListener = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
      if (changeInfo.url) {
        queryClient.invalidateQueries({ queryKey: connectedSiteQueryKey() });
      }
    };
    chrome.tabs.onActivated.addListener(activeListener);
    chrome.tabs.onUpdated.addListener(updateListener);
    return () => {
      chrome.tabs.onActivated.removeListener(activeListener);
      chrome.tabs.onUpdated.removeListener(updateListener);
      port.disconnect();
      clearInterval(interval);
    };
  };

  const initializeSidepanelState = async (windowId: number) => {
    if (windowType !== WindowType.sidepanel) return;
    await setSessionStorage(
      appendWindowId(
        BackgroundSessionStorageKey.SidepanelStatePrefix,
        windowId,
      ),
      SidepanelState.Active,
    );
  };

  const cleanupSidepanelState = async (windowId: number) => {
    if (windowType !== WindowType.sidepanel) return;
    setSessionStorage(
      appendWindowId(
        BackgroundSessionStorageKey.SidepanelStatePrefix,
        windowId,
      ),
      SidepanelState.Inactive,
    );
  };

  const initializeSidepanelEvents = (windowId: number) => {
    if (windowType !== WindowType.sidepanel) return () => {};
    const key = appendWindowId(
      BackgroundSessionStorageKey.SidepanelPayloadPrefix,
      windowId,
    );
    const handleEvent = (data: any) => {
      const screen = data.screen as string;
      const payload = encodePayload(data.payload);
      if (screen === 'connection') {
        navigation.push('internalConnectionApproval', {
          screen: 'connection',
          params: { payload, isInternal: true },
        });
      } else if (screen === 'transaction') {
        navigation.push('internalTransactionApproval', {
          screen: 'transaction',
          params: { payload, isInternal: true },
        });
      } else if (screen === 'message') {
        navigation.push('internalMessageApproval', {
          screen: 'message',
          params: { payload, isInternal: true },
        });
      }
      setSessionStorage(key, null);
    };
    const listener = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      const payloadChange = changes[key];
      if (!payloadChange?.newValue) return;
      handleEvent(payloadChange.newValue);
    };
    chrome.storage.session.onChanged.addListener(listener);
    return () => chrome.storage.session.onChanged.removeListener(listener);
  };

  const initialize = async () => {
    const window = await chrome.windows.getCurrent();
    const windowId = window.id;
    if (windowId === undefined) return;
    const initialCleanup = initializeSidepanel(windowId);
    const eventCleanup = initializeSidepanelEvents(windowId);
    await initializeSidepanelState(windowId);
    return async () => {
      initialCleanup();
      eventCleanup();
      await cleanupSidepanelState(windowId);
    };
  };

  const cleanup = async (handler: Promise<VoidPromiseFunction | undefined>) => {
    const destructor = await handler;
    if (destructor) {
      await destructor();
    }
  };

  useEffect(() => {
    const uninitialize = initialize();
    return () => discard(cleanup(uninitialize));
  }, []);
}
