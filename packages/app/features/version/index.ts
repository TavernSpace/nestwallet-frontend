import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { VersionResponse } from '../../common/api/nestwallet/types';
import { Tuple } from '../../common/types';
export type Version = `${number}.${number}.${number}`;

export function getUpdateStatus(version: VersionResponse): {
  isUpdateRecommended: boolean;
  isUpdateRequired: boolean;
} {
  const currentVersion = getCurrentVersion();
  const recommendedVersion =
    Platform.OS === 'ios'
      ? version.recommendedVersion.ios
      : version.recommendedVersion.android;
  const requiredVersion =
    Platform.OS === 'ios'
      ? version.requiredVersion.ios
      : version.requiredVersion.android;
  const isUpdateRecommended = currentVersion
    ? compareVersions(currentVersion, recommendedVersion) === -1
    : false;
  const isUpdateRequired = currentVersion
    ? compareVersions(currentVersion, requiredVersion) === -1
    : false;
  return {
    isUpdateRecommended,
    isUpdateRequired,
  };
}

// compareVersions returns -1 iff version < otherVersion, 0 iff version = otherVersion and 1 iff version > otherVersion
function compareVersions(version: Version, otherVersion: Version) {
  const [major1, minor1, sub1] = version
    .split('.')
    .map((v) => parseInt(v)) as Tuple<number, 3>;
  const [major2, minor2, sub2] = otherVersion
    .split('.')
    .map((v) => parseInt(v)) as Tuple<number, 3>;

  return (
    compareNumbers(major1, major2) ||
    compareNumbers(minor1, minor2) ||
    compareNumbers(sub1, sub2)
  );
}

function compareNumbers(num: number, otherNum: number) {
  return num > otherNum ? 1 : num < otherNum ? -1 : 0;
}

export function getCurrentVersion(): Version {
  const version = Constants.expoConfig!.version;
  return version as Version;
}
