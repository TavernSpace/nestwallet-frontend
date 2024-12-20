global.Buffer = require('buffer').Buffer;

import { EventEmitter } from 'eventemitter3';
import { browser } from 'webextension-polyfill-ts';
import { SidepanelState } from '../common/constants';
import { SERVICE_WORKER_SIDEPANEL_CHANNEL } from '../common/constants/worker/channel';
import {
  BackgroundSessionStorageKey,
  BackgroundStorageKey,
} from '../common/constants/worker/storage';
import { buildIntroQuery } from '../common/navigation/utils';
import { setLocalStorage, setSessionStorage } from '../common/storage';
import { appendWindowId, splitWindowId } from '../common/utils';
import { ApprovalService } from './services/approval-service';
import { ConnectionService } from './services/connection-service';
import { EthereumService } from './services/ethereum-service';
import { KeyringService } from './services/keyring/service';
import { NotificationService } from './services/notifications-service';
import { SolanaService } from './services/solana-service';
import { TonService } from './services/ton-service';
import { UserService } from './services/user-service';
import { WalletService } from './services/wallet-service';

// starts the background service.
function main() {
  // shared event message bus.
  const events = new EventEmitter();

  const approvalService = new ApprovalService();
  const connectionService = new ConnectionService();
  const keyringService = new KeyringService();
  const userService = new UserService(events, connectionService);
  const ethereumService = new EthereumService(
    events,
    approvalService,
    connectionService,
    userService,
  );
  const solanaService = new SolanaService(
    events,
    approvalService,
    connectionService,
    userService,
  );
  const tonService = new TonService(
    events,
    approvalService,
    connectionService,
    userService,
  );
  const walletService = new WalletService(
    approvalService,
    connectionService,
    keyringService,
    userService,
  );
  ethereumService.start();
  solanaService.start();
  tonService.start();
  walletService.start();
  NotificationService.start();
  browser.action.setBadgeBackgroundColor({ color: '#EFF455' });
  browser.action.setBadgeTextColor({ color: '#000000' });
  browser.runtime.onInstalled.addListener((event) => {
    if (event.reason === 'install') {
      browser.tabs.create({ url: buildIntroQuery() });
    } else if (event.reason === 'update') {
      setLocalStorage(BackgroundStorageKey.IsUpdated, true);
      // Clear old site data
      setLocalStorage('connected_sites_info', undefined);
    }
  });
  chrome.runtime.onConnect.addListener((port) => {
    const isSidepanelPort = port.name.startsWith(
      SERVICE_WORKER_SIDEPANEL_CHANNEL,
    );
    if (isSidepanelPort) {
      const windowId = splitWindowId(port.name);
      const key = appendWindowId(
        BackgroundSessionStorageKey.SidepanelStatePrefix,
        windowId,
      );
      port.onDisconnect.addListener(() => {
        setSessionStorage(key, SidepanelState.Inactive);
        approvalService.rejectAllOfType('sidepanel');
      });
      port.onMessage.addListener(() => port.postMessage('pong'));
    }
  });
  chrome.storage.local.get(BackgroundStorageKey.SettingsModified, (result) => {
    if (!result[BackgroundStorageKey.SettingsModified]) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    }
  });
}

main();
