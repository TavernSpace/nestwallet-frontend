import {
  CHANNEL_ETHEREUM_RPC_NOTIFICATION,
  CHANNEL_ETHEREUM_RPC_REQUEST,
  CHANNEL_ETHEREUM_RPC_RESPONSE,
  ETHEREUM_RPC_METHOD_CONNECT,
  ETHEREUM_RPC_METHOD_SWITCH_CHAIN,
  IActiveWalletUpdate,
  IChainIdUpdate,
  IConnected,
  INTERNAL_METHOD_PROVIDER_STATE,
  INotification,
  NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED,
  NOTIFICATION_ETHEREUM_CONNECTED,
  NOTIFICATION_ETHEREUM_DISCONNECTED,
  SWITCH_PROVIDER_REMAIN_RESPONSE,
  SWITCH_PROVIDER_SWITCH_RESPONSE,
} from '@nestwallet/app/common/constants/';
import { decodeMessage } from '@nestwallet/app/common/utils/encode';
import { Blocker } from '@nestwallet/app/common/utils/promise';
import { isSupportedChain } from '@nestwallet/app/features/chain';
import { ethErrors } from 'eth-rpc-errors';
import { ethers } from 'ethers';
import EventEmitter from 'eventemitter3';
import { getLogger } from '../logger';
import { isMobile, isValidEventOrigin } from '../utils';
import {
  resemblesETHAddress,
  sendEthRPCRequest,
  sendEvmTransaction,
  signEvmMessage,
  signEvmTransaction,
  signEvmTypedData,
} from './evm-utils';
import { RequestManager } from './request-manager';
import {
  BaseProviderState,
  EthersSendCallback,
  JsonRpcResponse,
  ProviderConnectInfo,
  ProviderRpcError,
  RequestAccountParams,
  RequestArguments,
  messages,
} from './types';
import { getSiteMetadata } from './utils';

const logger = getLogger('provider', 'ethereum-injection');

export class EthereumProvider extends EventEmitter {
  state!: BaseProviderState;

  /**
   * Channel to send extension specific RPC requests to the extension.
   */
  requestManager: RequestManager;

  /**
   * The chain ID of the currently connected Ethereum chain.
   */
  chainId: string;

  /**
   * The user's currently selected Ethereum address.
   */
  publicKey: string | null;

  /**
   * Boolean indicating that the provider is NestWallet.
   */
  isNestWallet: boolean;

  /**
   * Boolean for impersonating MetaMask.
   */
  isMetaMask: boolean;

  /**
   * Deprecated.
   */
  autoRefreshOnNetworkChange: boolean;

  isMobile: boolean;

  /**
   * Internal variable to check if our provider has been overriden
   */
  isOverriden: boolean;

  connectionRequest?: Promise<unknown>;

  chainRequest?: Promise<unknown>;

  // implements WalletProvider
  [prop: string]: unknown;

  private initWaiter: Blocker;

  constructor() {
    super();
    this.initWaiter = new Blocker();
    this.isMobile = isMobile();
    this.requestManager = new RequestManager(
      CHANNEL_ETHEREUM_RPC_REQUEST,
      CHANNEL_ETHEREUM_RPC_RESPONSE,
      this.isMobile,
    );
    this.isNestWallet = true;
    // default to mainnet but this can change upon connect
    this.chainId = '0x1';
    this.publicKey = null;
    this.autoRefreshOnNetworkChange = false;
    this.isMetaMask = true;
    this.isOverriden = false;

    window.addEventListener(
      'message',
      this.handleNotification.bind(this),
      this.isMobile,
    );
    if (this.isMobile) {
      this.initWaiter.unblock();
    } else {
      this.initialize().finally(() => this.initWaiter.unblock());
    }
  }

  //
  // Public methods
  //

  get networkVersion() {
    return parseInt(this.chainId, 16).toString();
  }

  get selectedAddress() {
    return this.publicKey;
  }

  /**
   * Returns whether the provider can process RPC requests.
   */
  public isConnected = (): boolean => {
    return !!this.publicKey;
  };

  // Deprecated EIP-1193 method
  public enable = async (): Promise<unknown> => {
    return this.request({ method: 'eth_requestAccounts' });
  };

  // Deprecated EIP-1193 method
  public send = async (
    methodOrRequest: string | RequestArguments,
    paramsOrCallback: Array<unknown> | EthersSendCallback,
  ): Promise<unknown> => {
    if (
      typeof methodOrRequest === 'string' &&
      typeof paramsOrCallback !== 'function'
    ) {
      const result = await this.request({
        method: methodOrRequest,
        params: paramsOrCallback,
      });
      return { result };
    } else if (
      typeof methodOrRequest === 'object' &&
      typeof paramsOrCallback === 'function'
    ) {
      return this.sendAsync(methodOrRequest, paramsOrCallback);
    }
    return Promise.reject(new Error('Unsupported function parameters'));
  };

  // Deprecated EIP-1193 method still in use by some DApps
  public sendAsync = (
    request: RequestArguments & { id?: number; jsonrpc?: string },
    callback: (error: unknown, response: unknown) => void,
  ): Promise<unknown> | void => {
    return this.request(request).then(
      (response) =>
        callback(null, {
          result: response,
          id: request.id,
          jsonrpc: request.jsonrpc,
        }),
      (error) => callback(error, null),
    );
  };

  public request = async (args: RequestArguments): Promise<JsonRpcResponse> => {
    return this.internalRequest(args, false);
  };

  public eip6963Request = async (
    args: RequestArguments,
  ): Promise<JsonRpcResponse> => {
    return this.internalRequest(args, true);
  };

  //
  // Private methods
  //

  private initialize = async () => {
    const result = await this.requestManager
      .request({
        method: INTERNAL_METHOD_PROVIDER_STATE,
        params: [],
      })
      .catch(() => null);
    if (!result) return;
    if (!result.chainId || !result.publicKey) return;
    const chain = `0x${result.chainId.toString(16)}`;
    this.handleConnect(chain);
    this.handleChainChanged(chain);
    this.handleAccountChanged(result.publicKey);
  };

  private internalRequest = async (
    args: RequestArguments,
    direct: boolean,
  ): Promise<JsonRpcResponse> => {
    if (!args || typeof args !== 'object' || Array.isArray(args)) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestArgs(),
        data: args,
      });
    }

    const { method, params } = args;
    logger.debug('request', method, args);

    if (typeof method !== 'string' || method.length === 0) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(method),
        data: args,
      });
    }

    if (
      params !== undefined &&
      !Array.isArray(params) &&
      (typeof params !== 'object' || params === null)
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestParams(),
        data: args,
      });
    }
    // We need to convert ethers BigNumber to hex because some dApps do not accept BigNumbers
    const functionMap: { [key: string]: (...args: any[]) => any } = {
      eth_accounts: () =>
        this.handleEthAccounts({
          canChooseProvider: !direct,
        }),
      eth_requestAccounts: () =>
        this.handleEthRequestAccounts({
          canChooseProvider: !direct,
          canShowConnectionPrompt: true,
        }),
      eth_chainId: () => this.handleEthChainId(),
      net_version: () => `${parseInt(this.chainId, 16)}`,
      eth_sign: (_address: string, message: string) =>
        this.handleEthSign(message),
      personal_sign: (messageHex: string, address: string) =>
        this.handleEthPersonalSign(messageHex, address),
      eth_signTypedData_v4: (address: string, typedData: string) =>
        this.handleEthSignTypedData(address, typedData),
      eth_signTransaction: (transaction: any) =>
        this.handleEthSignTransaction(transaction),
      eth_sendTransaction: (transaction: any) =>
        this.handleEthSendTransaction(transaction),
      wallet_switchEthereumChain: (chain) =>
        this.handleWalletSwitchChain(chain),
      wallet_addEthereumChain: (chain) => this.handleWalletAddChain(chain),
      wallet_requestPermissions: (...permissions) =>
        this.handleWalletRequestPermissions(permissions),
    };

    const func = functionMap[method];
    if (
      !func &&
      !method.startsWith('eth_') &&
      !method.startsWith('web3_clientVersion')
    ) {
      throw ethErrors.rpc.invalidRequest({
        message: messages.errors.invalidRequestMethod(method),
        data: args,
      });
    } else if (!func) {
      return this.handleEthRPC(method, params);
    }

    return func(...(<[]>(params ? params : [])));
  };

  /**
   *  Handle notifications from nestwallet.
   */
  private handleNotification = (event: MessageEvent) => {
    if (!isValidEventOrigin(event)) return;
    const data = decodeMessage<INotification<any>>(event.data);
    if (!data) return;
    if (data.type !== CHANNEL_ETHEREUM_RPC_NOTIFICATION) return;
    if (this.isOverriden) return;
    logger.debug('notification', event);
    switch (data.detail.name) {
      case NOTIFICATION_ETHEREUM_CONNECTED:
        this.handleNotificationConnected(data);
        break;
      case NOTIFICATION_ETHEREUM_DISCONNECTED:
        this.handleNotificationDisconnected();
        break;
      case NOTIFICATION_ETHEREUM_CHAIN_ID_UPDATED:
        this.handleNotificationChainIdUpdated(data);
        break;
      case NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED:
        this.handleNotificationActiveWalletUpdated(data);
        break;
      default:
        logger.debug(`unexpected notification ${data.detail.name}`);
        break;
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Notification Handlers
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Handle a connect notification from NestWallet.
   */
  private handleNotificationConnected = async (
    data: INotification<IConnected>,
  ) => {
    const { publicKey, chainId } = data.detail.data;
    this.handleConnect(chainId);
    this.handleChainChanged(chainId);
    this.handleAccountChanged(publicKey);
  };

  /**
   * Handle a disconnection notification from NestWallet.
   */
  private handleNotificationDisconnected = async () => {
    if (this.isConnected()) {
      // Reset public state
      this.publicKey = null;
    }
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#disconnect
    this.emit('disconnect', {
      code: 4900,
      message: 'User disconnected',
    } as ProviderRpcError);
  };

  private handleNotificationChainIdUpdated = async (
    data: INotification<IChainIdUpdate>,
  ) => {
    const { chainId } = data.detail.data;
    this.handleChainChanged(chainId);
  };

  /**
   * Handle a change of the active wallet in NestWallet.
   */
  private handleNotificationActiveWalletUpdated = async (
    data: INotification<IActiveWalletUpdate>,
  ) => {
    const { publicKey } = data.detail.data;
    this.handleAccountChanged(publicKey);
  };

  /////////////////////////////////////////////////////////////////////////////
  // State Change Handlers
  /////////////////////////////////////////////////////////////////////////////

  private handleAccountChanged = (publicKey: string) => {
    const parsedWallet = publicKey.toLowerCase();
    if (this.publicKey !== parsedWallet) {
      // Metamask set publicKey to lowercase
      this.publicKey = parsedWallet;
      // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#accountschanged
      this.emit('accountsChanged', [this.publicKey]);
    }
  };

  /**
   * Update local state and emit required event for connect.
   */
  private handleConnect = (chainId: string) => {
    const chainInt = parseInt(chainId, 16);
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#connect
    if (chainInt === 0 || !isSupportedChain(chainInt)) {
      this.emit('connect', { chainId: this.chainId } as ProviderConnectInfo);
    } else {
      this.chainId = chainId;
      this.emit('connect', { chainId } as ProviderConnectInfo);
    }
  };

  /**
   * Update local state and emit required event for chain change.
   */
  private handleChainChanged = (chainId: string) => {
    // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1193.md#chainchanged
    if (this.chainId !== chainId) {
      this.chainId = chainId;
      this.emit('chainChanged', chainId);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // Request Handlers
  /////////////////////////////////////////////////////////////////////////////

  private handleEthRPC = async (method: string, params: any) => {
    const chainId = parseInt(this.chainId, 16);
    return sendEthRPCRequest(this.requestManager, chainId, method, params);
  };

  /**
   * Handle eth_accounts requests
   */
  private handleEthAccounts = async (
    params: Omit<RequestAccountParams, 'canShowConnectionPrompt'>,
  ) => {
    return this.handleEthRequestAccounts({
      ...params,
      canShowConnectionPrompt: false,
    }).catch(() => []);
  };

  /**
   * Handle eth_requestAccounts requests
   */
  private handleEthRequestAccounts = async (params: RequestAccountParams) => {
    // Send request to the RPC API.
    if (this.connectionRequest) {
      return this.connectionRequest;
    } else {
      // We want to create and save a promise so duplicate connection requests
      // do not cause cause an additional request and instead just wait for this initial
      // request to resolve to its value
      const connectionRequest = this.makeConnectRequest(params).finally(() => {
        this.connectionRequest = undefined;
      });
      this.connectionRequest = connectionRequest;
      return connectionRequest;
    }
  };

  private handleEthChainId = async () => {
    await this.initWaiter.wait();
    return this.chainId;
  };

  private async makeConnectRequest(params: RequestAccountParams) {
    const metamaskProvider = window.nestWalletRouter
      .getProviders()
      .find((provider) => provider.isMetaMask && !provider.isNestWallet);
    const { title, imageUrl } = getSiteMetadata();
    const result = await this.requestManager.request({
      method: ETHEREUM_RPC_METHOD_CONNECT,
      params: [
        parseInt(this.chainId, 16),
        params.canChooseProvider ? !!metamaskProvider : false,
        params.canShowConnectionPrompt,
        title,
        imageUrl,
      ],
    });
    if (result === SWITCH_PROVIDER_SWITCH_RESPONSE) {
      const newProvider = metamaskProvider!;
      this.isOverriden = true;
      window.nestWalletRouter.switchProvider(newProvider);
      return await newProvider.request({
        method: params.permissions
          ? 'wallet_requestPermissions'
          : 'eth_requestAccounts',
        params: params.permissions,
      });
    } else if (result === SWITCH_PROVIDER_REMAIN_RESPONSE) {
      const result = await this.requestManager.request({
        method: ETHEREUM_RPC_METHOD_CONNECT,
        params: [
          parseInt(this.chainId, 16),
          false,
          params.canShowConnectionPrompt,
        ],
      });
      return result ? [(result.publicKey as string)?.toLowerCase()] : [];
    } else {
      // Metamask set publicKey to lowercase
      return result ? [(result.publicKey as string)?.toLowerCase()] : [];
    }
  }

  /**
   * Handle eth_sign RPC requests.
   */
  private handleEthSign = async (message: string) => {
    if (!this.publicKey) {
      throw ethErrors.provider.disconnected();
    }
    // Some websites like app.opium.finance pass in the entire message instead of
    // the hexlified version, so we need to check if the message needs to be hexlified
    const messageHex = !ethers.isHexString(message)
      ? ethers.hexlify(ethers.toUtf8Bytes(message))
      : message;
    const sig = await signEvmMessage(
      this.publicKey,
      this.requestManager,
      messageHex,
      parseInt(this.chainId),
    );
    return sig;
  };

  private handleEthPersonalSign = async (message: string, address: string) => {
    // fix issue with wrong params order
    // see: https://github.com/MetaMask/eth-json-rpc-middleware/blob/53c7361944c380e011f5f4ee1e184db746e26d73/src/wallet.ts#L284
    if (resemblesETHAddress(message) && !resemblesETHAddress(address)) {
      message = address;
    }
    return this.handleEthSign(message);
  };

  /**
   * Handle eth_signTypedData RPC requests.
   */
  private handleEthSignTypedData = async (
    address: string,
    typedData: string,
  ) => {
    if (!this.publicKey) {
      throw ethErrors.provider.disconnected();
    }
    return await signEvmTypedData(
      this.publicKey,
      this.requestManager,
      typedData,
      parseInt(this.chainId),
    );
  };

  /**
   * Handle eth_signTransaction RPC requests.
   */
  private handleEthSignTransaction = async (transaction: any) => {
    if (!this.publicKey) {
      throw ethErrors.provider.disconnected();
    }
    return await signEvmTransaction(this.publicKey, this.requestManager, {
      ...transaction,
      chainId: this.chainId,
    });
  };

  /**
   * Handle eth_sendTransaction RPC requests.
   */
  private handleEthSendTransaction = async (transaction: any) => {
    if (!this.publicKey) {
      throw ethErrors.provider.disconnected();
    }
    return await sendEvmTransaction(this.publicKey, this.requestManager, {
      ...transaction,
      chainId: this.chainId,
    });
  };

  private handleWalletAddChain = async (chain: { chainId: string }) => {
    return this.handleWalletSwitchChain(chain);
  };

  private handleWalletSwitchChain = async (chain: { chainId: string }) => {
    const chainInt = parseInt(chain.chainId, 16);
    if (this.chainRequest) {
      await this.chainRequest;
      return null;
    } else if (!this.isConnected()) {
      this.chainId = chain.chainId;
      return null;
    } else if (this.chainId === chain.chainId) {
      return null;
    } else {
      // TODO: instead of saving promise maybe for this its better to just throw an error for duplicate chain switch?
      this.chainRequest = this.requestManager
        .request({
          method: ETHEREUM_RPC_METHOD_SWITCH_CHAIN,
          params: [chainInt],
        })
        .finally(() => {
          this.chainRequest = undefined;
        });
      await this.chainRequest;
      return null;
    }
  };

  private handleWalletRequestPermissions = async (
    permissions: Record<string, any>[],
  ) => {
    return [{ parentCapability: 'eth_accounts' }];
  };
}
