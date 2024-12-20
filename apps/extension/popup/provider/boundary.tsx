import { VoidPromiseFunction } from '@nestwallet/app/common/types';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { ErrorScreen } from '@nestwallet/app/screens/error/screen';
import {
  FallbackProps,
  ErrorBoundary as RNErrorBoundary,
} from 'react-error-boundary';
import { useLocalLanguageContext } from './local-language';

export function ErrorBoundary(props: {
  onError: VoidPromiseFunction;
  onInitialError: VoidPromiseFunction;
  children: React.ReactNode;
}) {
  const { onError, onInitialError, children } = props;
  const { language } = useLocalLanguageContext();

  const AppErrorScreen = (props: FallbackProps) => {
    const { resetErrorBoundary } = props;

    const handleReset = async () => {
      await onError();
      resetErrorBoundary();
    };

    return onLoadable(language)(
      () => null,
      () => (
        <ErrorScreen
          {...props}
          language={ILanguageCode.En}
          onPress={handleReset}
        />
      ),
      (language) => (
        <ErrorScreen {...props} language={language} onPress={handleReset} />
      ),
    );
  };

  return (
    <RNErrorBoundary fallbackRender={AppErrorScreen} onError={onInitialError}>
      {children}
    </RNErrorBoundary>
  );
}
