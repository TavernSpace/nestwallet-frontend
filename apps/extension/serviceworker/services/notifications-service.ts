/// <reference lib="webworker" />

import { browser } from 'webextension-polyfill-ts';
import { BackgroundStorageKey } from '../../common/constants/worker/storage';
import { buildQuery } from '../../common/navigation/utils';
import { openPopupWindow } from '../popup';

// TODO: should this be saved somewhere else
const devSenderId = '1069570609019';
const prodSenderId = '844436514059';

export interface NotificationData {
  associatedEntityId: string;
  associatedEntityType: string;
  'gcm.notification.title': string;
  'gcm.notification.body': string;
  id: string;
  organizationId: string;
  totalCount: string;
  userId: string;
}

export class NotificationService {
  private constructor() {}
  private notifications: Map<string, NotificationData> = new Map();

  public static start() {
    const service = new NotificationService();
    service.initialize();
    return service;
  }

  private initialize() {
    const senderIds = [devSenderId, prodSenderId];
    chrome.gcm.register(senderIds, this.registerCallback.bind(this));
    chrome.gcm.onMessage.addListener(this.handleMessage.bind(this));
    chrome.notifications.onClicked.addListener(this.handleClick.bind(this));
    chrome.notifications.onClosed.addListener(
      this.handleNotificationClosed.bind(this),
    );
  }

  private async registerCallback(regId: string) {
    const registrationId = regId;
    if (!chrome.runtime.lastError) {
      const key = BackgroundStorageKey.DeviceID;
      await browser.storage.local.set({ [key]: registrationId });
    }
  }

  private handleClick(notificationId: string) {
    const notification = this.notifications.get(notificationId);
    if (notification && notification.associatedEntityType === 'proposal') {
      const url = buildQuery({
        path: 'apps/transactionProposal',
        params: {
          proposalId: notification.associatedEntityId,
        },
      });
      openPopupWindow(url);
    }
  }

  private handleNotificationClosed(notificationId: string) {
    this.notifications.delete(notificationId);
  }

  private handleMessage(message: chrome.gcm.IncomingMessage) {
    const data = message.data as NotificationData;
    const totalCount = data.totalCount;
    if (totalCount) {
      if (totalCount === '0') {
        chrome.action.setBadgeText({ text: '' });
      } else {
        chrome.action.setBadgeText({ text: totalCount });
      }
    }
    // Pop up a notification to show the GCM message.
    if (data['gcm.notification.title']) {
      chrome.notifications.create(
        {
          iconUrl: 'images/logo.png',
          type: 'basic',
          title: data['gcm.notification.title'],
          message: data['gcm.notification.body'],
        },
        (notificationId: string) => {
          if (!chrome.runtime.lastError) {
            this.notifications.set(notificationId, data);
          }
        },
      );
    }
  }
}
