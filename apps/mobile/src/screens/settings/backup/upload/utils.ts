import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { CloudStorage } from 'react-native-cloud-storage';

GoogleSignin.configure({
  scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  webClientId:
    '844436514059-1ti4lb4iisshk87fvre42m6v56de38vf.apps.googleusercontent.com',
});

export const ensureCloudStorage = async (
  preventLock: (enable: boolean) => void,
) => {
  if (Platform.OS === 'android') {
    preventLock(false);
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    CloudStorage.setGoogleDriveAccessToken(tokens.accessToken);
    preventLock(true);
  } else if (Platform.OS === 'ios') {
    const isCloudAvailable = await CloudStorage.isCloudAvailable();
    if (!isCloudAvailable) {
      throw new Error('Please enable iCloud to continue');
    }
  } else {
    throw new Error('Unsupported platform');
  }
};
