import { browser } from 'webextension-polyfill-ts';
import { PasswordAlarmKey } from '../../../common/constants/worker/alarms';
import { BackgroundSessionStorageKey } from '../../../common/constants/worker/storage';

export class TimeLockedStore<T> {
  private key: string;
  private autoLockCountdownAlarmId: string;
  private minutesUntilAutoLock: number | undefined;
  private autoLockTimeKey: string;
  private defaultLockTime = 60;

  constructor() {
    this.key = BackgroundSessionStorageKey.Password;
    this.autoLockTimeKey = BackgroundSessionStorageKey.AutoLockTime;
    this.autoLockCountdownAlarmId = PasswordAlarmKey;
    this.initializeAutoLockTime();
    browser.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === this.autoLockCountdownAlarmId) {
        browser.alarms.clear(this.autoLockCountdownAlarmId);
        this.lock();
      }
    });
  }

  public async lock() {
    await chrome.storage.session.remove(this.key);
  }

  public async isLocked() {
    const key = this.key;
    const result = await chrome.storage.session.get(key);
    const data = result[key];
    return !data;
  }

  public async setData(data: T) {
    await chrome.storage.session.set({
      [this.key]: data,
    });
  }

  public async getData(): Promise<T> {
    const key = this.key;
    const result = await chrome.storage.session.get(key);
    const data = result[key];
    if (data) {
      return data as T;
    }
    throw new Error('locked');
  }

  public async restartTimer() {
    await browser.alarms.clear(this.autoLockCountdownAlarmId);
    if (this.minutesUntilAutoLock) {
      browser.alarms.create(this.autoLockCountdownAlarmId, {
        delayInMinutes: this.minutesUntilAutoLock,
      });
    } else if (this.minutesUntilAutoLock === 0) {
      await this.lock();
    }
  }

  public async setMinutesUntilAutoLock(minutes: number) {
    this.minutesUntilAutoLock = minutes;
    await chrome.storage.local.set({ [this.autoLockTimeKey]: minutes });
  }

  public getMinutesUntilAutoLock(): number {
    return this.minutesUntilAutoLock ?? this.defaultLockTime;
  }

  /////////////////////////////////////////////////////////////////////////////
  // private function
  /////////////////////////////////////////////////////////////////////////////

  private async initializeAutoLockTime() {
    const result = await chrome.storage.local.get(this.autoLockTimeKey);
    if (result[this.autoLockTimeKey] !== undefined) {
      this.minutesUntilAutoLock = result[this.autoLockTimeKey];
    } else {
      await this.setMinutesUntilAutoLock(
        this.minutesUntilAutoLock ?? this.defaultLockTime,
      );
    }
  }

  private async stopAutoLockCountdownTimer() {
    await browser.alarms.clear(this.autoLockCountdownAlarmId);
  }
}
