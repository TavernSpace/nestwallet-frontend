import { Buffer } from 'buffer';
import { ImagePickerAsset } from 'expo-image-picker';
import { Platform } from 'react-native';
import * as mime from 'react-native-mime-types';
import { ReactNativeFile } from '../../common/hooks/graphql';

function dataUrlToFile(dataUrl: string, filename: string): File | undefined {
  const arr = dataUrl.split(',');
  if (arr.length < 2) {
    return undefined;
  }
  const mimeArr = arr[0]!.match(/:(.*?);/);
  if (!mimeArr || mimeArr.length < 2) {
    return undefined;
  }
  const mime = mimeArr[1];
  const buff = Buffer.from(arr[1]!, 'base64');
  return new File([buff], filename, { type: mime });
}

export function getExtractableFileFromImagePickerAsset(
  asset: ImagePickerAsset,
): File | ReactNativeFile {
  const uri = asset.uri;
  if (Platform.OS === 'web') {
    const file = dataUrlToFile(uri, 'image');
    if (!file) {
      throw new Error('invalid asset');
    }
    return file;
  }
  return new ReactNativeFile({
    uri: uri,
    type: mime.lookup(uri) || 'image',
    name: 'image',
  });
}

export async function convertToBase64(url: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  const base64 = new Promise((res) => {
    reader.onloadend = () => {
      res(reader.result);
    };
  });
  return base64;
}

export function getExtractableFileFromImage(
  uri: string,
): File | ReactNativeFile {
  if (Platform.OS === 'web') {
    const file = dataUrlToFile(uri, 'image');
    if (!file) {
      throw new Error('invalid uri');
    }
    return file;
  }
  return new ReactNativeFile({
    uri: uri,
    type: mime.lookup(uri) || 'image',
    name: 'image',
  });
}
