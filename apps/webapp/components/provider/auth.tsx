import { SignInInput } from '@nestwallet/app/common/api/nestwallet/types';
import { UserData } from '@nestwallet/app/common/types';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { useQueryClient } from '@tanstack/react-query';
import React, { createContext, useContext } from 'react';

interface IAuthContext {
  signIn: (form: SignInInput) => Promise<UserData>;
  isSignedIn: () => boolean;
}

export const AuthContext = createContext<IAuthContext>({} as any);

export function AuthContextProvider(props: { children: React.ReactNode }) {
  const { apiClient } = useNestWallet();
  const queryClient = useQueryClient();

  const handleSignIn = async (form: SignInInput) => {
    const result = await apiClient.signIn({ ...form, isWeb: true });
    queryClient.getQueryCache().clear();
    localStorage.setItem('userData', JSON.stringify(result)); //Store userData for autologin
    return result;
  };

  const isSignedIn = () => {
    // TODO: this is not completely correct since session token could be expired or revoked
    return apiClient.hasUserData();
  };

  // We may need logging out in the future!
  // const handleLogout = async () => {
  //   const deviceId = await messaging().getToken();
  //   queryClient.getQueryCache().clear();
  //   await apiClient.logout({ deviceId });
  //   await walletService.logout();
  // };

  const authContext: IAuthContext = {
    signIn: handleSignIn,
    isSignedIn,
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
