import {
  IApproveConnectionInput,
  IApproveInput,
  IApproveMessageInput,
  IApproveSwitchChainInput,
  IApproveTransactionInput,
} from '@nestwallet/app/common/types';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { v4 } from 'uuid';
import { Windows, browser } from 'webextension-polyfill-ts';
import { SidepanelState } from '../common/constants';
import { BackgroundSessionStorageKey } from '../common/constants/worker/storage';
import { buildApprovalQuery } from '../common/navigation/utils';
import { getSessionStorage, setSessionStorage } from '../common/storage';
import { appendWindowId } from '../common/utils';

export async function openApproveChooseProviderPopupWindow(
  input: IApproveInput,
) {
  return openPopupOrSidepanel('chooseProvider', input, true);
}

export async function openApproveConnectionPopupWindow(
  input: IApproveConnectionInput,
) {
  return openPopupOrSidepanel('approval/connection', input);
}

export async function openApproveSwitchChainPopupWindow(
  input: IApproveSwitchChainInput,
) {
  return openPopupOrSidepanel('approval/chain', input);
}

export async function showInvalidChainMessage(tabId: number) {
  return showPopupMessage(
    'Network change failed',
    'The network you selected is not supported by Nest Wallet',
    4000,
    tabId,
  );
}

export async function showSafeNotDeployedMessage(
  tabId: number,
  chainName: string,
) {
  return showPopupMessage(
    'Network change failed',
    `You have not deployed your Safe to ${chainName}`,
    4000,
    tabId,
  );
}

export async function openApproveTransactionPopupWindow(
  input: IApproveTransactionInput,
) {
  return openPopupOrSidepanel('approval/transaction', input);
}

export async function openApproveMessageWindow(input: IApproveMessageInput) {
  return openPopupOrSidepanel('approval/message', input);
}

export async function openPopupWindow(url: string): Promise<Windows.Window> {
  const lastWindow = await browser.windows.getLastFocused();
  const [EXTRA_HEIGHT, EXTRA_WIDTH] =
    (navigator as any).userAgentData.platform === 'Windows'
      ? [36, 12]
      : [28, 0];
  const popupWindow = await browser.windows.create({
    url,
    type: 'popup',
    width: SCREEN_WIDTH + EXTRA_WIDTH,
    height: SCREEN_HEIGHT + EXTRA_HEIGHT,
    top: lastWindow.top,
    left:
      (lastWindow.left ?? 0) +
      ((lastWindow.width ?? 0) - SCREEN_WIDTH - EXTRA_WIDTH),
    focused: true,
  });
  return popupWindow;
}

async function openPopupOrSidepanel(
  path: string,
  payload: IApproveInput | IApproveTransactionInput | IApproveMessageInput,
  forcePopup = false,
) {
  const url = buildApprovalQuery({
    path,
    payload,
  });
  if (payload.windowId === undefined || forcePopup) {
    return openPopupWindow(url);
  }
  const key = appendWindowId(
    BackgroundSessionStorageKey.SidepanelStatePrefix,
    payload.windowId,
  );
  const sidepanelState = await getSessionStorage(key);
  if (sidepanelState === SidepanelState.Active) {
    const splitPath = path.split('/');
    await setSessionStorage(
      appendWindowId(
        BackgroundSessionStorageKey.SidepanelPayloadPrefix,
        payload.windowId,
      ),
      {
        // generate an id so the value of this payload is always different
        id: v4(),
        screen: splitPath[splitPath.length - 1],
        payload,
      },
    );
    return null;
  } else {
    return openPopupWindow(url);
  }
}

async function showPopupMessage(
  title: string,
  subtitle: string,
  duration: number,
  tabId: number,
) {
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_POPUP_MESSAGE',
    message: { title, subtitle, duration },
  });
}
