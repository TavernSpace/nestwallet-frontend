import {
  BACKEND_EVENT,
  ETHEREUM_RPC_METHOD_CONNECT,
  ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
  ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
  ETHEREUM_RPC_METHOD_SIGN_TX,
  ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
  NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
  SOLANA_RPC_METHOD_CONNECT,
  SOLANA_RPC_METHOD_SIGN_MESSAGE,
  SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
} from '@nestwallet/app/common/constants';
import { encodeTransaction } from '@nestwallet/app/common/utils/encode';
import { Blocker } from '@nestwallet/app/common/utils/promise';
import {
  ChainId,
  supportedChainsForBlockchain,
} from '@nestwallet/app/features/chain';
import { isEVMAddress } from '@nestwallet/app/features/evm/utils';
import {
  IBlockchainType,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { Core } from '@walletconnect/core';
import { buildApprovedNamespaces, getSdkError } from '@walletconnect/utils';
import {
  Web3Wallet,
  Web3WalletTypes,
  type IWeb3Wallet,
} from '@walletconnect/web3wallet';
import { encode } from 'bs58';
import { EventEmitter } from 'eventemitter3';
import { EthereumService } from './ethereum-service';
import { SolanaService } from './solana-service';
import { AsyncJSONStorage, AsyncStorageKey } from './storage';
import { Notification } from './types';

// TODO: better error handling. walletconnect sdk logs a lot of errors
export class WalletConnectProvider {
  public static readonly WALLETCONNECT_PROJECT_ID =
    'ab8ba260b8cc9a9b24746532b7a18799';
  public static readonly SUPPORTED_EVM_METHODS = [
    'eth_sign',
    'personal_sign',
    'eth_signTypedData_v4',
    'eth_sendTransaction',
    'eth_signTransaction',
    'eth_sendRawTransaction',
  ];
  public static readonly SUPPORTED_SVM_METHODS = [
    'solana_getAccounts',
    'solana_requestAccounts',
    'solana_signTransaction',
    'solana_signMessage',
  ];
  public static readonly SUPPORTED_SESSION_EVENTS = [
    'accountsChanged',
    'chainChanged',
  ];
  public static readonly EVM_CHAINS = supportedChainsForBlockchain[
    IBlockchainType.Evm
  ].map((chain) => `eip155:${chain.id}`);
  public static readonly SOLANA_CHAINS = [
    'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
  ];

  private web3wallet?: IWeb3Wallet;
  private initialized = false;
  private failed = false;
  private blocker?: Blocker;

  constructor(
    private ethereumService: EthereumService,
    private solanaService: SolanaService,
    private eventEmitter: InstanceType<typeof EventEmitter<string>>,
    private asyncStorage: AsyncJSONStorage,
  ) {}

  public async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    const blocker = new Blocker();
    this.blocker = blocker;
    const core = new Core({
      projectId: WalletConnectProvider.WALLETCONNECT_PROJECT_ID,
    });
    this.web3wallet = await Web3Wallet.init({
      core,
      metadata: {
        name: 'Nest Wallet',
        description: 'The easiest wallet to trade any token',
        url: 'https://www.nestwallet.xyz/',
        icons: [
          'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/nest_logo.svg',
        ],
      },
    })
      .then((web3wallet) => {
        web3wallet.on('session_proposal', this.onSessionProposal.bind(this));
        web3wallet.on('session_request', this.onSessionRequest.bind(this));
        return web3wallet;
      })
      .catch((err) => {
        this.failed = true;
        this.initialized = false;
        blocker.unblock();
        throw err;
      });
    this.failed = false;
    this.eventEmitter.on(BACKEND_EVENT, this.onEvent.bind(this));
    blocker.unblock();
  }

  public async uninitialize() {
    if (!this.initialized) {
      return;
    } else if (this.blocker) {
      // we want to wait for the initialize to fully finish before we uninitialize to prevent leaking any memory
      await this.blocker.wait();
    }
    this.failed = false;
    this.initialized = false;
    if (this.web3wallet) {
      this.web3wallet.off('session_proposal', this.onSessionProposal);
      this.web3wallet.off('session_request', this.onSessionRequest);
      this.eventEmitter.off(BACKEND_EVENT, this.onEvent);
    }
  }

  public async connect(uri: string) {
    // If the initial walletconnect init attempt failed, try again on scan qr code
    if (this.failed) {
      await this.initialize();
    }
    if (!this.web3wallet) {
      throw new Error(
        'WalletConnect client not initialized, please wait and try again',
      );
    } else {
      await this.web3wallet.pair({ uri }); // emits a session_proposal event and handelled by onSessionProposal
    }
  }

  public async disconnectAll() {
    if (!this.web3wallet) {
      return;
    }
    const activeSessions = this.web3wallet.getActiveSessions();
    await Promise.all(
      Object.keys(activeSessions).map((topic) =>
        this.web3wallet?.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        }),
      ),
    );
    await this.asyncStorage.set(AsyncStorageKey.WalletConnectConnections, {});
  }

  public async getConnections(): Promise<
    Record<
      string,
      {
        title: string;
        imageUrl: string;
      }
    >
  > {
    const connections = await this.asyncStorage.get(
      AsyncStorageKey.WalletConnectConnections,
    );
    return connections ?? {};
  }

  public async confirmConnection(
    wallet: IWallet,
    proposal: Web3WalletTypes.SessionProposal,
  ) {
    const { id, params } = proposal;
    const web3wallet = this.web3wallet;
    const namespaces = buildApprovedNamespaces({
      proposal: params,
      supportedNamespaces: {
        eip155: {
          chains: WalletConnectProvider.EVM_CHAINS,
          methods: [...WalletConnectProvider.SUPPORTED_EVM_METHODS],
          events: WalletConnectProvider.SUPPORTED_SESSION_EVENTS,
          accounts: WalletConnectProvider.EVM_CHAINS.map(
            (chain) => `${chain}:${wallet.address}`,
          ),
        },
        solana: {
          chains: WalletConnectProvider.SOLANA_CHAINS,
          methods: [...WalletConnectProvider.SUPPORTED_SVM_METHODS],
          events: WalletConnectProvider.SUPPORTED_SESSION_EVENTS,
          accounts: WalletConnectProvider.SOLANA_CHAINS.map(
            (chain) => `${chain}:${wallet.address}`,
          ),
        },
      },
    });
    if (web3wallet) {
      await web3wallet.approveSession({
        id,
        namespaces,
      });
    }
  }

  public async rejectConnection({ id }: Web3WalletTypes.SessionProposal) {
    const web3wallet = this.web3wallet;
    if (web3wallet) {
      await web3wallet.rejectSession({
        id,
        reason: getSdkError('USER_REJECTED_METHODS'),
      });
    }
  }

  public async confirmRequest(
    event: Web3WalletTypes.SessionRequest,
    result: any,
  ) {
    const { topic, id } = event;
    const web3wallet = this.web3wallet;
    if (web3wallet) {
      await web3wallet.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          result,
        },
      });
    }
  }

  public async rejectRequest(event: Web3WalletTypes.SessionRequest) {
    const { topic, id } = event;
    const web3wallet = this.web3wallet;
    if (web3wallet) {
      await web3wallet.respondSessionRequest({
        topic,
        response: {
          id,
          jsonrpc: '2.0',
          error: {
            code: 5000,
            message: 'User rejected.',
          },
        },
      });
    }
  }

  public async emitAccountsChanged(pubkey: string) {
    const web3wallet = this.web3wallet;
    if (!web3wallet) return;
    const sessions = web3wallet.getActiveSessions();
    if (isEVMAddress(pubkey)) {
      Object.values(sessions)
        .filter(
          (session) =>
            session.requiredNamespaces.eip155 ||
            session.optionalNamespaces.eip155,
        )
        .forEach(async (session) => {
          await web3wallet.emitSessionEvent({
            topic: session.topic,
            event: {
              name: 'accountsChanged',
              data: [pubkey],
            },
            chainId:
              session.requiredNamespaces.eip155?.chains?.[0] ||
              session.optionalNamespaces.eip155!.chains?.[0] ||
              'eip155:1',
          });
        });
    } else {
      Object.values(sessions)
        .filter(
          (session) =>
            session.requiredNamespaces.solana ||
            session.optionalNamespaces.solana,
        )
        .forEach(async (session) => {
          await web3wallet.emitSessionEvent({
            topic: session.topic,
            event: {
              name: 'accountsChanged',
              data: [pubkey],
            },
            chainId:
              session.requiredNamespaces.solana?.chains?.[0] ||
              session.optionalNamespaces.solana!.chains?.[0] ||
              'solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ',
          });
        });
    }
  }

  private onEvent(notification: Notification) {
    if (
      notification.name === NOTIFICATION_ETHEREUM_ACTIVE_WALLET_UPDATED ||
      notification.name === NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED
    ) {
      this.emitAccountsChanged(
        (notification.data as { publicKey: string }).publicKey,
      );
    }
  }

  private async onSessionProposal(proposal: Web3WalletTypes.SessionProposal) {
    const { requiredNamespaces, optionalNamespaces } = proposal.params;
    if (requiredNamespaces.eip155 || optionalNamespaces.eip155) {
      return this.handleEVMProposal(proposal);
    } else if (requiredNamespaces.solana || optionalNamespaces.solana) {
      return this.handleSVMProposal(proposal);
    }
  }

  private async onSessionRequest(event: Web3WalletTypes.SessionRequest) {
    if (event.params.chainId.startsWith('eip155:')) {
      return this.handleEVMRequest(event);
    } else if (event.params.chainId.startsWith('solana:')) {
      return this.handleSVMRequest(event);
    } else {
      return this.rejectRequest(event);
    }
  }

  private async handleEVMProposal(proposal: Web3WalletTypes.SessionProposal) {
    const { id, params } = proposal;
    const { proposer, requiredNamespaces, optionalNamespaces } = params;
    const chain =
      requiredNamespaces?.eip155?.chains?.[0] ||
      optionalNamespaces?.eip155?.chains?.[0];
    const chainId = parseInt(chain?.split('eip155:')[1] || '1');

    const sender = {
      title: proposer.metadata.name,
      url: proposer.metadata.url,
      imageUrl: proposer.metadata.icons[0],
    };
    await this.setConnectionMetadata(
      proposer.metadata.url,
      proposer.metadata.name,
      proposer.metadata.icons[0] ?? '',
    );
    const request = {
      id: id.toString(),
      method: ETHEREUM_RPC_METHOD_CONNECT,
      params: [chainId, '', true],
    };
    return this.ethereumService.handleRequest({
      request,
      sender,
      walletConnect: {
        proposal,
      },
    });
  }

  private async handleSVMProposal(proposal: Web3WalletTypes.SessionProposal) {
    const { id, params } = proposal;
    const { proposer } = params;

    const sender = {
      title: proposer.metadata.name,
      url: proposer.metadata.url,
      imageUrl: proposer.metadata.icons[0],
    };
    await this.setConnectionMetadata(
      proposer.metadata.url,
      proposer.metadata.name,
      proposer.metadata.icons[0] ?? '',
    );
    const request = {
      id: id.toString(),
      method: SOLANA_RPC_METHOD_CONNECT,
      params: [ChainId.Solana, false],
    };
    return this.solanaService.handleRequest({
      request,
      sender,
      walletConnect: {
        proposal,
      },
    });
  }

  private async handleEVMRequest(event: Web3WalletTypes.SessionRequest) {
    const { id, topic, params, verifyContext } = event;
    const rpcMethod = params.request.method;
    const chainId = params.chainId.split('eip155:')[1]!;
    const connection = await this.getConnectionMetadata(
      verifyContext.verified.origin,
    );
    const sender = {
      title: connection?.title || '',
      url: verifyContext.verified.origin,
      imageUrl: connection?.imageUrl,
    };

    if (rpcMethod === 'personal_sign') {
      const [message, walletAddress] = params.request.params;
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
        params: [message, walletAddress, parseInt(chainId)],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'eth_sign') {
      const [walletAddress, message] = params.request.params;
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_MESSAGE,
        params: [message, walletAddress, parseInt(chainId)],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'eth_signTypedData_v4') {
      const [walletAddress, message] = params.request.params;
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_TYPED_DATA,
        params: [message, walletAddress, parseInt(chainId)],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'eth_sendTransaction') {
      const { from, to, data, gasPrice, gas, value } = params.request.params[0];
      const tx = encodeTransaction({
        to,
        value,
        data,
        chainId: parseInt(chainId),
      });
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
        params: [tx, ''],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'eth_signTransaction') {
      const { from, to, data, gasPrice, gas, value } = params.request.params[0];
      const tx = encodeTransaction({
        to,
        value,
        data,
        chainId: parseInt(chainId),
      });
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_TX,
        params: [tx, ''],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'eth_sendRawTransaction') {
      const [tx] = params.request.params;
      const request = {
        id: id.toString(),
        method: ETHEREUM_RPC_METHOD_SIGN_AND_SEND_TX,
        params: [tx, ''],
      };
      this.ethereumService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    }
  }

  private async handleSVMRequest(event: Web3WalletTypes.SessionRequest) {
    const { id, topic, params, verifyContext } = event;
    const rpcMethod = params.request.method;
    const connection = await this.getConnectionMetadata(
      verifyContext.verified.origin,
    );
    const sender = {
      title: connection?.title || '',
      url: verifyContext.verified.origin,
      imageUrl: connection?.imageUrl,
    };

    if (rpcMethod === 'solana_signMessage') {
      const { message, pubKey } = params.request.params;
      const request = {
        id: id.toString(),
        method: SOLANA_RPC_METHOD_SIGN_MESSAGE,
        params: [pubKey, message, ChainId.Solana],
      };
      await this.solanaService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    } else if (rpcMethod === 'solana_signTransaction') {
      const base64Tx = params.request.params.transaction;
      const base58Tx = encode(Buffer.from(base64Tx, 'base64'));
      const request = {
        id: id.toString(),
        method: SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
        params: ['', [base58Tx]],
      };
      await this.solanaService.handleRequest({
        request,
        sender,
        walletConnect: {
          request: event,
        },
      });
    }
  }

  private async getConnectionMetadata(origin: string): Promise<
    | {
        title: string;
        imageUrl: string;
      }
    | undefined
  > {
    const connections = await this.asyncStorage.get(
      AsyncStorageKey.WalletConnectConnections,
    );
    const validConnections = connections ?? {};
    return validConnections[origin];
  }

  private async setConnectionMetadata(
    origin: string,
    title: string,
    imageUrl: string,
  ) {
    const connections = await this.asyncStorage.get(
      AsyncStorageKey.WalletConnectConnections,
    );
    await this.asyncStorage.set(AsyncStorageKey.WalletConnectConnections, {
      ...connections,
      [origin]: { title, imageUrl },
    });
  }
}
