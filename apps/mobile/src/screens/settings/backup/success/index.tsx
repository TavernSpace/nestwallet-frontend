import { BackupSuccessScreen } from '@nestwallet/app/screens/backup/success';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'backupSuccess'
>;

export const BackupSuccessWithData = withUserContext(_BackupSuccessWithData);

function _BackupSuccessWithData({ route, navigation }: RouteProps) {
  const { isRestore } = route.params;

  const handleDone = async () => {
    navigation.getParent()?.goBack();
  };

  return <BackupSuccessScreen isRestore={isRestore} onDone={handleDone} />;
}
