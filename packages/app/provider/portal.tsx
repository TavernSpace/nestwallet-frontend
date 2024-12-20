import { Portal } from 'react-native-paper';
import { SnackbarContextProvider } from './snackbar';

interface PortalProviderProps {
  type: 'portal' | 'full' | 'none';
  ignoreInset?: boolean;
  children: React.ReactNode;
}

export function PortalProvider(props: PortalProviderProps) {
  const { type, ignoreInset = false, children } = props;

  return type === 'portal' ? (
    <Portal.Host>{children}</Portal.Host>
  ) : type === 'full' ? (
    <Portal.Host>
      <SnackbarContextProvider ignoreInset={ignoreInset}>
        {children}
      </SnackbarContextProvider>
    </Portal.Host>
  ) : (
    children
  );
}
