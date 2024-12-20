import { AsyncJSONStorage, AsyncStorageKey, UserSessionData } from './storage';

export class SessionService {
  private asyncStorage: AsyncJSONStorage;

  constructor(asyncStorage: AsyncJSONStorage) {
    this.asyncStorage = asyncStorage;
  }

  public async getUserSessionData(): Promise<UserSessionData> {
    const key = AsyncStorageKey.UserSessionData;
    const data = await this.asyncStorage.get(key);
    if (!data) {
      throw new Error('not logged in');
    }
    return data;
  }

  public async setUserSessionData(data: UserSessionData): Promise<void> {
    const key = AsyncStorageKey.UserSessionData;
    await this.asyncStorage.set(key, data);
  }
}
