import {
  GenerateTokenInput,
  SignInInput,
  SignInWithTokenInput,
  UpdateEmailVerifyInput,
} from '@nestwallet/app/common/api/nestwallet/types';
import { UserData, VoidPromiseFunction } from '@nestwallet/app/common/types';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext } from 'react';
import { useAppContext } from './application';

interface IAuthContext {
  signIn: (form: SignInInput) => Promise<UserData>;
  tokenSignIn: (form: SignInWithTokenInput) => Promise<UserData>;
  generateToken: (form: GenerateTokenInput) => Promise<UserData>;
  logout: VoidPromiseFunction;
  updateEmail: (form: UpdateEmailVerifyInput) => Promise<void>;
}

const AuthContext = createContext<IAuthContext>({} as any);

export function AuthContextProvider(props: { children: React.ReactNode }) {
  const { walletService } = useAppContext();
  const { apiClient } = useNestWallet();
  const queryClient = useQueryClient();

  const handleSignIn = async (form: SignInInput) => {
    const result = await apiClient.signIn(form);
    queryClient.getQueryCache().clear();
    await walletService.login(result);
    return result;
  };

  const handleTokenSignIn = async (form: SignInWithTokenInput) => {
    const result = await apiClient.signInWithToken(form);
    queryClient.getQueryCache().clear();
    await walletService.login(result);
    return result;
  };

  const handleGenerateToken = async (form: GenerateTokenInput) => {
    const result = await apiClient.generateToken(form);
    queryClient.getQueryCache().clear();
    await walletService.setLocalToken(result.token);
    await walletService.login(result);
    return result;
  };

  const handleLogout = async () => {
    const deviceId = await walletService.getDeviceId();
    queryClient.getQueryCache().clear();
    await apiClient.logout({ deviceId });
    await walletService.logout();
    chrome.action.setBadgeText({ text: '' });
  };

  const handleUpdateEmail = async (form: UpdateEmailVerifyInput) => {
    await apiClient.updateEmail(form);
  };

  const authContext: IAuthContext = {
    signIn: handleSignIn,
    tokenSignIn: handleTokenSignIn,
    generateToken: handleGenerateToken,
    logout: handleLogout,
    updateEmail: handleUpdateEmail,
  };

  return (
    <AuthContext.Provider value={authContext}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
