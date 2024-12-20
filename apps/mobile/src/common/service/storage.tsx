import {
  ConnectedSitesData,
  Origin,
  SiteInfo,
  UserData,
} from '@nestwallet/app/common/types';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { asyncStorage } from '../../provider/constants';

export enum AsyncStorageKey {
  DeviceData = 'device_data',
  UserDeviceData = 'user_device_data',
  UserSessionData = 'user_session_data',
  PreferencesData = 'preferences_data',
  TradeSettingsData = 'trade_settings_data',
  TokenDetailSettingsData = 'token_details_settings_data',
  LocalToken = 'local_token',
  AutoLockTime = 'auto_lock_time',
  Language = 'language',
  TonConnectConnections = 'tonconnect_http_bridge_connections',
  TonConnectLastEventId = 'tonconnect_http_bridge_lastEventId',
  WalletConnectConnections = 'walletconnect_connection_data',
}

export interface DeviceData {
  hasShownNotificationPrompt: boolean;
  referralCode: string | null;
}

// user data persisted across session
export interface UserDeviceData {
  isSetup: boolean;
  hasUserPassword: boolean;
  encryptedBackupPassword?: string;
}

// user data valid during a session
export interface UserSessionData {
  user: UserData;
  selectedWallet?: string;
  selectedEvmWallet?: string;
  selectedSvmWallet?: string;
  selectedTvmWallet?: string;
  // NOTE: needed to change the object keys here to avoid type conflicts from old versions
  site?: SiteInfo;
  connections?: ConnectedSitesData;
  browserHistory?: Origin[];
}

export class AsyncJSONStorage {
  public async get(key: string) {
    const stringValue = await AsyncStorage.getItem(key);
    return stringValue ? JSON.parse(stringValue) : undefined;
  }

  public async set(key: string, value: unknown) {
    const stringValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
  }
}

export const getLocalLanguage = async () => {
  const data = await asyncStorage.get(AsyncStorageKey.Language);
  const language: ILanguageCode = data ?? ILanguageCode.En;
  return Object.values(ILanguageCode).includes(language)
    ? language
    : ILanguageCode.En;
};

export const setLocalLanguage = async (language: ILanguageCode) => {
  await asyncStorage.set(AsyncStorageKey.Language, language);
};
