import { Version } from '../../../features/version';
import { UserData } from '../../types';

export enum NestWalletClientEvents {
  ConnectedSiteChanged = 'NestWalletClientEvents::ConnectedSiteChanged',
  NewAppVersion = 'NestWalletClientEvents::NewAppVersion',
  RequiresLogin = 'NestWalletClientEvents::RequiresLogin',
  SubscriptionRequired = 'NestWalletClientEvents::SubscriptionRequired',
}

// params

export interface GenerateSignInCodeInput {
  email: string;
  referralCode?: string;
}

export interface SignInInput {
  email: string;
  oneTimeCode: string;
  deviceId?: string;
  isMobile: boolean;
  isWeb?: boolean;
}

export interface SignOutInput {
  deviceId?: string;
}

export interface GenerateTokenInput {
  deviceId?: string;
  isMobile: boolean;
  name: string;
}

export interface SignInWithTokenInput {
  token: string;
  deviceId?: string;
  isMobile: boolean;
}

export interface UpdateEmailCodeInput {
  email: string;
}

export interface UpdateEmailVerifyInput {
  email: string;
  oneTimeCode: string;
}

export interface UpdateDeviceInput {
  deviceId: string;
}

export interface GenerateSignInCodeResponse {
  email: string;
}

export interface GenerateTokenResponse extends UserData {
  token: string;
}

export interface UpdateEmailCodeResponse {
  email: string;
}

// lifi
export type LifiRoutesSuccessResult<T> = {
  routes: T;
  error?: never;
};

export type LifiRouteErrorResult<T> = {
  routes?: never;
  error: T;
};

export type LifiRouteResponse<TResult = any, TError = any> =
  | LifiRoutesSuccessResult<TResult>
  | LifiRouteErrorResult<TError>;

// referral

export interface ReferralLinkResponse {
  referralLink: string;
  error?: string;
}

// rpc

export type RpcRequest = {
  method: string;
  params?: any;
  id?: number;
};

type RPCSuccessResult<T> = {
  result: T;
  error?: never;
};

type RPCErrorResult<T> = {
  result?: never;
  error: T;
};

export type RpcResponse<TResult = any, TError = any> = {
  jsonrpc: `${number}`;
  id: number;
} & (RPCSuccessResult<TResult> | RPCErrorResult<TError>);

// Meta

export interface VersionResponse {
  recommendedVersion: PlatformVersion;
  requiredVersion: PlatformVersion;
}

interface PlatformVersion {
  chromeExtension: Version;
  ios: Version;
  android: Version;
}
