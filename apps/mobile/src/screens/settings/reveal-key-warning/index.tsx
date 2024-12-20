import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { parseError } from '@nestwallet/app/features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { RevealKeyWarningScreen } from '@nestwallet/app/screens/signer/reveal-key-warning/screen';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSignerById } from '../../../hooks/signer';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = NativeStackScreenProps<
  SettingsStackParamList,
  'revealKeyWarning'
>;

export const RevealKeyWarningWithData = withUserContext(
  _RevealKeyWarningWithData,
);

function _RevealKeyWarningWithData({ route, navigation }: RouteProps) {
  const { walletId, secretType } = route.params;
  const { signer } = useSignerById(walletId);
  const { walletService } = useAppContext();
  const { showSnackbar } = useSnackbar();
  useResetToOnInvalid('app', !signer);

  const handleRevealKey = async () => {
    try {
      if (!signer) return;
      await walletService.unlock();
      const keyring = await walletService.getKeyring(signer.keyringIdentifier!);
      navigation.navigate('revealKey', {
        walletId: route.params.walletId,
        data: keyring.value,
        secretType,
      });
    } catch (err) {
      const error = parseError(err, 'Error unlocking wallet');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
  };

  return signer ? (
    <RevealKeyWarningScreen
      signer={signer}
      onRevealPress={handleRevealKey}
      secretType={secretType}
    />
  ) : null;
}
