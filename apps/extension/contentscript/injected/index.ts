import { getLogger } from '../../common/logger';
import { EthereumProvider } from '../../common/provider/evm';
import { SolanaProvider } from '../../common/provider/svm';
import { TonProvider } from '../../common/provider/tvm';
import { initEIP6963Provider } from './init-eip6963';
import { initEthereumProvider } from './init-evm';
import { initSolanaProvider } from './init-svm';
import { initTonProvider } from './init-tvm';

const logger = getLogger('injection', 'main');

export function main() {
  logger.debug('starting injected script');
  window.nestwallet = {} as any;
  const nestWalletEthereum = new EthereumProvider();
  const nestWalletSolana = new SolanaProvider();
  const nestWalletTon = new TonProvider();
  try {
    initEthereumProvider(window, nestWalletEthereum);
    logger.debug('successfully injected Ethereum provider');
  } catch (err) {
    logger.error(`failed to inject Nest Wallet into window.ethereum: ${err}`);
  }
  try {
    initSolanaProvider(window, nestWalletSolana);
    logger.debug('successfully injected Solana provider');
  } catch (err) {
    logger.error(`failed to inject Nest Wallet into window.solana: ${err}`);
  }
  try {
    initTonProvider(window, nestWalletTon);
    logger.debug('successfully injected TON provider');
  } catch (err) {
    logger.error(`failed to inject Nest Wallet into window.nestwallet: ${err}`);
  }
  try {
    initEIP6963Provider(window, nestWalletEthereum);
    logger.debug('successfully injected EIP6963 provider');
  } catch (err) {
    logger.error(`failed to emit Nest Wallet eip6963 event: ${err}`);
  }
  logger.debug('provider ready');
}

main();
