import { ExecutionContextProvider } from '@nestwallet/app/provider/execution';
import React from 'react';
import { usePreferenceContext } from './preferences';

export function ExecutionProvider(props: { children: React.ReactNode }) {
  const { children } = props;
  const { preferences } = usePreferenceContext();

  return (
    <ExecutionContextProvider preferences={preferences}>
      {children}
    </ExecutionContextProvider>
  );
}
