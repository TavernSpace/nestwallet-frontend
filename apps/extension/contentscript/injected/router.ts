import { EthereumProvider } from '../../common/provider/evm';

export class WalletRouter {
  private nestProvider: EthereumProvider;
  private currentProvider: EvmWalletProvider;
  private providers: EvmWalletProvider[];

  public constructor(window: Window, nestProvider: EthereumProvider) {
    this.nestProvider = nestProvider;
    this.currentProvider = nestProvider;
    this.providers = window.ethereum ? [window.ethereum] : [];
  }

  public getCurrentProvider(): EvmWalletProvider {
    return this.currentProvider;
  }

  public getProviders(): EvmWalletProvider[] {
    return this.providers;
  }

  public addProvider(newProvider: EvmWalletProvider) {
    this.providers.push(newProvider);
  }

  public switchProvider(newProvider: EvmWalletProvider) {
    if (this.currentProvider === this.nestProvider) {
      // when we switch providers we need to move over all the registered event listeners
      // to the new provider so switching account, chain, etc. from the wallet works properly
      const registeredEvents = this.nestProvider.eventNames().map((event) => ({
        name: event,
        events: this.nestProvider.listeners(event),
      }));
      this.nestProvider.removeAllListeners();
      registeredEvents.forEach((eventData) =>
        eventData.events.forEach((event) =>
          newProvider.on(eventData.name.toString(), event),
        ),
      );
    }
    this.currentProvider = newProvider;
  }
}
