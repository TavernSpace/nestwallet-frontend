import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { parseError } from '@nestwallet/app/features/errors';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { RevealKeyWarningScreen } from '@nestwallet/app/screens/signer/reveal-key-warning/screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import { useSignerById } from '../../../hooks/signer';
import { SettingsStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { withUserContext } from '../../../provider/user/wrapper';
import { PasswordSheet } from './password-sheet';

type RouteProps = StackScreenProps<SettingsStackParamList, 'revealKeyWarning'>;

export const RevealKeyWarningWithData = withUserContext(
  _RevealKeyWarningWithData,
);

function _RevealKeyWarningWithData({ route, navigation }: RouteProps) {
  const { walletId, secretType } = route.params;
  const { signer } = useSignerById(walletId);
  const { walletService } = useAppContext();
  const { unlock } = useLockContext();
  const { showSnackbar } = useSnackbar();
  useResetToOnInvalid('app', !signer);

  const [showPasswordSheet, setShowPasswordSheet] = useState(false);

  const handleRevealKey = () => {
    setShowPasswordSheet(true);
  };

  const handleUnlock = async (password: string) => {
    try {
      await unlock(password);
      const keyring = await walletService.getKeyring(
        signer!.keyringIdentifier!,
      );
      navigation.navigate('revealKey', {
        walletId,
        data: keyring.value,
        secretType: secretType,
      });
    } catch (err) {
      const error = parseError(err, 'Invalid Password');
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: error.message,
      });
    }
    setShowPasswordSheet(false);
  };

  return signer ? (
    <>
      <RevealKeyWarningScreen
        signer={signer}
        onRevealPress={handleRevealKey}
        secretType={secretType}
      />
      <PasswordSheet
        secretType={secretType}
        isShowing={showPasswordSheet}
        handleUnlock={handleUnlock}
        onClose={() => setShowPasswordSheet(false)}
      />
    </>
  ) : null;
}
