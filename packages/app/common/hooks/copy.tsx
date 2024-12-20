import * as Clipboard from 'expo-clipboard';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';

export function useCopy(message?: string) {
  const { showSnackbar } = useSnackbar();

  const copy = (text: string) => {
    Clipboard.setStringAsync(text);
    showSnackbar({
      severity: ShowSnackbarSeverity.success,
      message: message || 'Copied!',
    });
  };

  return { copy };
}
