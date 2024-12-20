import {
  CHANNEL_SOLANA_RPC_NOTIFICATION,
  CHANNEL_SOLANA_RPC_REQUEST,
  CHANNEL_SOLANA_RPC_RESPONSE,
  IActiveWalletUpdate,
  INotification,
  NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED,
  NOTIFICATION_SOLANA_CONNECTED,
  NOTIFICATION_SOLANA_DISCONNECTED,
  SOLANA_RPC_METHOD_CONNECT,
  SOLANA_RPC_METHOD_SIGN_MESSAGE,
  SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
} from '@nestwallet/app/common/constants/';
import { decodeMessage } from '@nestwallet/app/common/utils/encode';
import { ChainId } from '@nestwallet/app/features/chain';
import { getSolanaConnection } from '@nestwallet/app/features/svm/utils';
import { defaultSvmParentPath } from '@nestwallet/app/features/wallet/seedphrase';
import {
  SolanaSignAndSendTransaction,
  SolanaSignAndSendTransactionFeature,
  SolanaSignAndSendTransactionMethod,
  SolanaSignAndSendTransactionOutput,
  SolanaSignIn,
  SolanaSignInFeature,
  SolanaSignInMethod,
  SolanaSignInOutput,
  SolanaSignMessage,
  SolanaSignMessageFeature,
  SolanaSignMessageInput,
  SolanaSignMessageMethod,
  SolanaSignMessageOutput,
  SolanaSignTransaction,
  SolanaSignTransactionFeature,
  SolanaSignTransactionInput,
  SolanaSignTransactionMethod,
  SolanaSignTransactionOutput,
} from '@solana/wallet-standard-features';
import { createSignInMessage } from '@solana/wallet-standard-util';
import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';
import type { Wallet } from '@wallet-standard/base';
import {
  StandardConnect,
  StandardConnectFeature,
  StandardConnectMethod,
  StandardDisconnect,
  StandardDisconnectFeature,
  StandardDisconnectMethod,
  StandardEvents,
  StandardEventsFeature,
  StandardEventsListeners,
  StandardEventsNames,
  StandardEventsOnMethod,
} from '@wallet-standard/features';
import { mnemonicToSeedSync } from 'bip39';
import { decode, encode } from 'bs58';
import { HDKey } from 'micro-ed25519-hdkey';
import { getLogger } from '../../logger';
import { isMobile, isValidEventOrigin } from '../../utils';
import { RequestManager } from '../request-manager';
import { getSiteMetadata } from '../utils';
import { SolanaAccount } from './account';
import { SOLANA_CHAINS, nestWalletIcon } from './types';

const logger = getLogger('provider', 'solana-injection');

export class SolanaProvider implements Wallet {
  readonly #listeners: {
    [E in StandardEventsNames]?: StandardEventsListeners[E][];
  } = {};
  readonly #version = '1.0.0' as const;
  readonly #name = 'Nest Wallet' as const;
  readonly #icon = nestWalletIcon;

  #connection: Connection;

  #account: SolanaAccount | null = null;

  #requestManager: RequestManager;

  #isMobile: boolean;

  constructor() {
    this.#connection = getSolanaConnection();
    this.#isMobile = isMobile();
    this.#requestManager = new RequestManager(
      CHANNEL_SOLANA_RPC_REQUEST,
      CHANNEL_SOLANA_RPC_RESPONSE,
      this.#isMobile,
    );

    window.addEventListener(
      'message',
      this.handleNotifications.bind(this),
      this.#isMobile,
    );
  }

  get version() {
    return this.#version;
  }

  get name() {
    return this.#name;
  }

  get icon() {
    return this.#icon;
  }

  get chains() {
    return SOLANA_CHAINS.slice();
  }

  get features(): StandardConnectFeature &
    StandardDisconnectFeature &
    StandardEventsFeature &
    SolanaSignAndSendTransactionFeature &
    SolanaSignTransactionFeature &
    SolanaSignMessageFeature &
    SolanaSignInFeature {
    return {
      [StandardConnect]: {
        version: '1.0.0',
        connect: this.#connect,
      },
      [StandardDisconnect]: {
        version: '1.0.0',
        disconnect: this.#disconnect,
      },
      [StandardEvents]: {
        version: '1.0.0',
        on: this.#on,
      },
      [SolanaSignAndSendTransaction]: {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signAndSendTransaction: this.#signAndSendTransaction,
      },
      [SolanaSignTransaction]: {
        version: '1.0.0',
        supportedTransactionVersions: ['legacy', 0],
        signTransaction: this.#signTransaction,
      },
      [SolanaSignMessage]: {
        version: '1.0.0',
        signMessage: this.#signMessage,
      },
      [SolanaSignIn]: {
        version: '1.0.0',
        signIn: this.#signIn,
      },
    };
  }

  get accounts() {
    return this.#account ? [this.#account] : [];
  }

  private async handleNotifications(event: MessageEvent) {
    if (!isValidEventOrigin(event)) return;
    const data = decodeMessage<INotification<any>>(event.data);
    if (!data) return;
    if (data.type !== CHANNEL_SOLANA_RPC_NOTIFICATION) return;
    logger.debug('notification', event);
    switch (data.detail.name) {
      case NOTIFICATION_SOLANA_CONNECTED:
        break;
      case NOTIFICATION_SOLANA_DISCONNECTED:
        break;
      case NOTIFICATION_SOLANA_ACTIVE_WALLET_UPDATED:
        this.handleNotificationActiveWalletUpdated(data);
        break;
      default:
        logger.debug(`unexpected notification ${data.detail.name}`);
    }
  }

  #on: StandardEventsOnMethod = (event, listener) => {
    this.#listeners[event]?.push(listener) ||
      (this.#listeners[event] = [listener]);
    return (): void => this.#off(event, listener);
  };

  #emit<E extends StandardEventsNames>(
    event: E,
    ...args: Parameters<StandardEventsListeners[E]>
  ): void {
    // eslint-disable-next-line prefer-spread
    this.#listeners[event]?.forEach((listener) => listener.apply(null, args));
  }

  #off<E extends StandardEventsNames>(
    event: E,
    listener: StandardEventsListeners[E],
  ): void {
    this.#listeners[event] = this.#listeners[event]?.filter(
      (existingListener) => listener !== existingListener,
    );
  }

  #connect: StandardConnectMethod = async ({ silent } = {}) => {
    if (this.#account) {
      return { accounts: this.accounts };
    }
    const { title, imageUrl } = getSiteMetadata();
    const result = await this.#requestManager.request({
      method: SOLANA_RPC_METHOD_CONNECT,
      params: [ChainId.Solana, silent, title, imageUrl],
    });
    this.#account = new SolanaAccount(result.publicKey);
    this.#emit('change', { accounts: this.accounts });
    return { accounts: this.accounts };
  };

  #disconnect: StandardDisconnectMethod = async () => {
    // note: don't call SOLANA_RPC_METHOD_DISCONNECT - our definition of disconnect
    // not only disconnect wallet from site but removes the site from connectedSite
    this.#account = null;
    this.#emit('change', { accounts: this.accounts });
  };

  #signAndSendTransaction: SolanaSignAndSendTransactionMethod = async (
    ...inputs
  ) => {
    logger.debug('signAndSendTransaction');
    if (!this.#connection) {
      throw new Error('wallet not connected');
    }
    const signedTransactionsOutputs = await this.#signTransaction(...inputs);

    const outputs: SolanaSignAndSendTransactionOutput[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const signature = await this.#connection.sendRawTransaction(
        signedTransactionsOutputs[0]!.signedTransaction,
        inputs[0]!.options,
      );
      outputs.push({ signature: Buffer.from(signature) });
    }
    return outputs;
  };

  #signTransaction: SolanaSignTransactionMethod = async (...inputs) => {
    logger.debug('signTransaction');
    return this.signAllTransactions(inputs);
  };

  #signMessage: SolanaSignMessageMethod = async (...inputs) => {
    if (!this.#account) {
      await this.#connect();
    }
    if (!this.#account) {
      throw new Error('wallet not connected');
    }
    const outputs: SolanaSignMessageOutput[] = [];
    for (const input of inputs) {
      const { message } = input;
      const signature = await this.#requestManager.request({
        method: SOLANA_RPC_METHOD_SIGN_MESSAGE,
        params: [this.#account.address, encode(message), ChainId.Solana],
      });
      outputs.push({
        signedMessage: message,
        signature: decode(signature),
      });
    }
    return outputs;
  };

  #signIn: SolanaSignInMethod = async (...inputs) => {
    if (!this.#account) {
      await this.#connect();
    }
    if (!this.#account) {
      throw new Error('wallet not connected');
    }

    const signMessageInputs: SolanaSignMessageInput[] = [];
    for (const input of inputs) {
      // domain?
      const message = createSignInMessage({
        domain: input.domain!,
        address: this.#account.address,
        ...input,
      });
      signMessageInputs.push({ account: this.#account, message });
    }
    const signMessageOutputs = await this.#signMessage(...signMessageInputs);

    return signMessageOutputs.map((output) => {
      return {
        account: this.#account,
        signedMessage: output.signedMessage,
        signature: output.signature,
      } as SolanaSignInOutput;
    });
  };

  getKeypairFromSeed(seedPhrase: string) {
    const seed = mnemonicToSeedSync(seedPhrase);
    const path = `${defaultSvmParentPath}/0'/0'`; // Common derivation path for Solana
    const hd = HDKey.fromMasterSeed(seed.toString('hex'));
    return Keypair.fromSeed(hd.derive(path).privateKey);
  }

  async signAllTransactions(
    inputs: readonly SolanaSignTransactionInput[],
  ): Promise<Array<SolanaSignTransactionOutput>> {
    if (!this.#account) {
      await this.#connect();
    }
    if (!this.#account) {
      throw new Error('wallet not connected');
    }
    const transactions = inputs.map(({ transaction }) => {
      return encode(transaction);
    });
    const signatures: string[] = await this.#requestManager.request({
      method: SOLANA_RPC_METHOD_SIGN_TRANSACTIONS,
      params: [this.#account.address, transactions],
    });
    return signatures.map((signatures, index) => {
      const input = inputs[index]!;
      const transaction = VersionedTransaction.deserialize(input.transaction);
      transaction.addSignature(
        new PublicKey(this.#account!.publicKey),
        decode(signatures),
      );
      return { signedTransaction: transaction.serialize() };
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  // State Change Handlers
  /////////////////////////////////////////////////////////////////////////////

  /**
   * Handle a change of the active wallet in NestWallet.
   */
  private handleNotificationActiveWalletUpdated = async (
    data: INotification<IActiveWalletUpdate>,
  ) => {
    const { publicKey } = data.detail.data;
    if (publicKey !== this.#account?.address) {
      this.#account = new SolanaAccount(publicKey);
      this.#emit('change', { accounts: this.accounts });
    }
  };
}
