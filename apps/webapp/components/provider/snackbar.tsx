import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { delay } from '@nestwallet/app/common/api/utils';
import { opaque } from '@nestwallet/app/common/utils/functions';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { colors } from '@nestwallet/app/design/constants';
import { ShowSnackbarSeverity } from '@nestwallet/app/provider/snackbar';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface ISnackbarContext {
  showSnackbar: (params: {
    duration: number;
    message: string;
    severity: ShowSnackbarSeverity;
  }) => void;
}

export const SnackbarContext = createContext<ISnackbarContext>({} as any);

export function SnackbarContextProvider(props: { children: React.ReactNode }) {
  const [snackbar, setSnackbar] = useState<{
    message: string;
    visible: boolean;
    bgColor: string;
    textColor: string;
  } | null>(null);

  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    if (snackbar?.visible) {
      setOpacity(1);
    }
  }, [snackbar?.visible]);

  const showSnackbar = async (props: {
    duration: number;
    message: string;
    severity: ShowSnackbarSeverity;
  }) => {
    const { duration, message, severity } = props;
    const bgColor =
      severity === ShowSnackbarSeverity.success
        ? opaque(colors.success, colors.background, 10)
        : opaque(colors.failure, colors.background, 10);

    const textColor =
      severity === ShowSnackbarSeverity.success
        ? colors.success
        : colors.failure;
    setSnackbar({ message, visible: true, bgColor, textColor });
    await delay(duration);
    handleClose();
  };

  const handleClose = async () => {
    setOpacity(0);
    await delay(200);
    setSnackbar((prev) => (prev ? { ...prev, visible: false } : null));
  };

  const context = useMemo(() => ({ showSnackbar }), []);

  return (
    <SnackbarContext.Provider value={context}>
      {props.children}
      {snackbar && snackbar.visible && (
        <div
          className='fixed left-1/2 top-4 z-50 flex -translate-x-1/2 transform items-center space-x-2 rounded-xl p-4 text-xs shadow-lg transition-all duration-200 md:text-base'
          style={{ opacity, backgroundColor: snackbar.bgColor }}
        >
          <span style={{ color: snackbar.textColor }}>{snackbar.message}</span>
          <IconButton
            icon={faTimes}
            onPress={handleClose}
            size={20}
            color={colors.textPrimary}
          />
        </div>
      )}
    </SnackbarContext.Provider>
  );
}

export function useWebSnackbar() {
  return useContext(SnackbarContext);
}
