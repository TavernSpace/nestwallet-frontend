import { EventEmitter } from 'eventemitter3';
import { Client, ClientOptions, createClient } from 'graphql-ws';
import { UserData } from '../../types';
import {
  JupiterQuoteResponse,
  JupiterSwapInput,
  JupiterSwapResponse,
} from '../jupiter/types';
import { LifiQuoteResponse, LifiRouteInput } from '../lifi/types';
import { HttpStatusCode } from './constant';
import {
  GenerateSignInCodeInput,
  GenerateSignInCodeResponse,
  GenerateTokenInput,
  GenerateTokenResponse,
  LifiRouteResponse,
  NestWalletClientEvents,
  ReferralLinkResponse,
  RpcRequest,
  RpcResponse,
  SignInInput,
  SignInWithTokenInput,
  SignOutInput,
  UpdateDeviceInput,
  UpdateEmailCodeInput,
  UpdateEmailCodeResponse,
  UpdateEmailVerifyInput,
  VersionResponse,
} from './types';
import { getAPIEndpoint } from './utils';

const HTTPHeaderKeyAuthorization = 'Authorization';

export class NestWalletClient {
  private apiEndpoint: string;
  private userData?: UserData;
  private eventEmitter: InstanceType<typeof EventEmitter<string>>;
  private rpcRequestId = 1;

  constructor(eventEmitter: InstanceType<typeof EventEmitter<string>>) {
    this.apiEndpoint = getAPIEndpoint();
    this.eventEmitter = eventEmitter;
  }

  public setUserData(userData?: UserData) {
    if (!userData) {
      this.userData = undefined;
      return;
    }
    const expireAt = new Date(userData.expireAt);
    const now = new Date();
    if (expireAt.getTime() < now.getTime()) {
      throw new Error('user data has expired');
    }
    this.userData = userData;
  }

  public hasUserData() {
    return !!this.userData;
  }

  /////////////////////////////////////////////////////////////////////////////
  // static
  /////////////////////////////////////////////////////////////////////////////

  public static getFileURL(fileID: string) {
    return `${getAPIEndpoint()}/v1/files/${fileID}`;
  }

  /////////////////////////////////////////////////////////////////////////////
  // graphql
  /////////////////////////////////////////////////////////////////////////////

  public fetchGraphql = (init: RequestInit): Promise<Response> => {
    const url = `${this.apiEndpoint}/v1/graphql`;
    init.headers = {
      ...this.getDefaultHeaders(),
      ...init.headers,
    };
    return fetch(url, init).then((resp) => {
      this.handleError(resp);
      return resp;
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // helper
  /////////////////////////////////////////////////////////////////////////////

  public postJSON<Response>(url: string, body: any): Promise<Response> {
    return this.post(url, JSON.stringify(body), {
      'Content-Type': 'application/json',
    });
  }

  public getJSON<Response>(url: string): Promise<Response> {
    url = `${this.apiEndpoint}${url}`;
    return new Promise((resolve, reject) => {
      fetch(url, {
        credentials: 'include',
        headers: {
          ...this.getDefaultHeaders(),
        },
        method: 'GET',
        mode: 'cors',
      })
        .then(this.handleFetchResult)
        .then(resolve)
        .catch(reject);
    });
  }

  public wss(options: Omit<ClientOptions, 'url'>): Client {
    const accessToken = this.userData?.accessToken || '';
    const url = `${this.apiEndpoint}/v1/graphql?token=${accessToken}`;
    const wsClient = createClient({
      ...options,
      url,
    });
    return wsClient;
  }

  /////////////////////////////////////////////////////////////////////////////
  // auth
  /////////////////////////////////////////////////////////////////////////////

  public async generateSigninCode(
    form: GenerateSignInCodeInput,
  ): Promise<GenerateSignInCodeResponse> {
    const response = await this.postJSON<GenerateSignInCodeResponse>(
      '/auth/code',
      form,
    );
    return response;
  }

  public async signIn(form: SignInInput): Promise<UserData> {
    const userData = await this.postJSON<UserData>('/auth/signin', form);
    this.setUserData(userData);
    return userData;
  }

  public async generateToken(
    form: GenerateTokenInput,
  ): Promise<GenerateTokenResponse> {
    const response = await this.postJSON<GenerateTokenResponse>(
      '/auth/private/generate_token',
      form,
    );
    const userData: UserData = { ...response };
    delete (userData as any)['token'];
    this.setUserData(userData);
    return response;
  }

  public async signInWithToken(form: SignInWithTokenInput): Promise<UserData> {
    const userData = await this.postJSON<UserData>(
      '/auth/private/signin',
      form,
    );
    this.setUserData(userData);
    return userData;
  }

  public async logout(form: SignOutInput): Promise<void> {
    await this.postJSON('/auth/logout', form);
    // don't delete userData (and thus access token until we logged out)
    // otherwise we can't logout properly
    this.setUserData(undefined);
  }

  public async updateEmailCode(
    form: UpdateEmailCodeInput,
  ): Promise<UpdateEmailCodeResponse> {
    const response = await this.postJSON<UpdateEmailCodeResponse>(
      '/auth/update/code',
      form,
    );
    return response;
  }

  public async updateEmail(form: UpdateEmailVerifyInput): Promise<void> {
    await this.postJSON('/auth/update/verify', form);
  }

  public async updateDevice(form: UpdateDeviceInput): Promise<void> {
    await this.postJSON('/auth/update/device', form);
  }

  /////////////////////////////////////////////////////////////////////////////
  // routing
  /////////////////////////////////////////////////////////////////////////////

  public async getLifiRoute(input: LifiRouteInput): Promise<LifiRouteResponse> {
    const response = await this.postJSON<LifiRouteResponse>(`/v1/route`, input);
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  public async getLifiQuote(query: string): Promise<LifiQuoteResponse> {
    return this.getJSON<LifiQuoteResponse>(`/v1/quote?${query}`);
  }

  public async getSolanaRoute(query: string): Promise<JupiterQuoteResponse> {
    return this.getJSON<JupiterQuoteResponse>(`/v1/solana/route?${query}`);
  }

  public async getSolanaTransaction(
    input: JupiterSwapInput,
  ): Promise<JupiterSwapResponse> {
    return this.postJSON<JupiterSwapResponse>(`/v1/solana/transaction`, input);
  }

  public async getSolanaDexes() {
    return this.getJSON<string[]>(`/v1/solana/dexes`);
  }

  /////////////////////////////////////////////////////////////////////////////
  // referral
  /////////////////////////////////////////////////////////////////////////////

  public async getReferralLink(
    referralCode: string,
  ): Promise<ReferralLinkResponse> {
    const response = await this.getJSON<ReferralLinkResponse>(
      `/referral/link/${referralCode}`,
    );
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  /////////////////////////////////////////////////////////////////////////////
  // rpc
  /////////////////////////////////////////////////////////////////////////////

  public async sendEVMRPCRequest(
    chainId: number,
    request: RpcRequest,
  ): Promise<RpcResponse> {
    const response = await this.postJSON<RpcResponse>(
      `/v1/rpc/evm/${chainId}`,
      { id: this.rpcRequestId++, ...request },
    );
    if (response.error) {
      throw response.error;
    }
    return response.result;
  }

  /////////////////////////////////////////////////////////////////////////////
  // meta
  /////////////////////////////////////////////////////////////////////////////

  public async getVersion(): Promise<VersionResponse> {
    const result = await fetch(`${this.apiEndpoint}/version`, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'GET',
      mode: 'cors',
    });
    return result.json();
  }

  /////////////////////////////////////////////////////////////////////////////
  // private
  /////////////////////////////////////////////////////////////////////////////

  private post<Response>(
    url: string,
    body: string | FormData,
    headers: HeadersInit = {},
  ): Promise<Response> {
    url = `${this.apiEndpoint}${url}`;
    return new Promise((resolve, reject) => {
      fetch(url, {
        credentials: 'include',
        headers: {
          ...headers,
          ...this.getDefaultHeaders(),
        },
        method: 'POST',
        mode: 'cors',
        body: body,
      })
        .then(this.handleFetchResult)
        .then(resolve)
        .catch(reject);
    });
  }

  private handleFetchResult = (resp: Response) => {
    if (this.handleError(resp)) {
      return;
    }
    if (resp.status >= HttpStatusCode.Ok && resp.status < 300) {
      return resp.json();
    }
    return resp.json().then((json) => {
      throw json;
    });
  };

  private handleError(resp: Response): boolean {
    switch (resp.status) {
      case HttpStatusCode.Unauthorized: {
        this.eventEmitter.emit(NestWalletClientEvents.RequiresLogin);
        return true;
      }
      case HttpStatusCode.UnprocessableEntity: {
        this.eventEmitter.emit(NestWalletClientEvents.NewAppVersion);
        return true;
      }
    }
    return false;
  }

  private getDefaultHeaders = () => {
    const headers: { [key: string]: string } = {};
    if (this.userData) {
      headers[
        HTTPHeaderKeyAuthorization
      ] = `Bearer ${this.userData.accessToken}`;
    }
    return headers;
  };
}
