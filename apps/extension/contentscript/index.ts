import {
  CHANNEL_ETHEREUM_RPC_NOTIFICATION,
  CHANNEL_ETHEREUM_RPC_REQUEST,
  CHANNEL_ETHEREUM_RPC_RESPONSE,
  CHANNEL_SOLANA_RPC_NOTIFICATION,
  CHANNEL_SOLANA_RPC_REQUEST,
  CHANNEL_SOLANA_RPC_RESPONSE,
  CHANNEL_TON_RPC_NOTIFICATION,
  CHANNEL_TON_RPC_REQUEST,
  CHANNEL_TON_RPC_RESPONSE,
} from '@nestwallet/app/common/constants';
import { ContentScriptChannel } from '../common/channel/content-script-channel';
import { getLogger } from '../common/logger';

const logger = getLogger('content-script', 'main');

// Script entry.
function main() {
  logger.debug('starting content script');
  logger.debug('creating content channel');
  initChannels();
  logger.debug('content channel created');
}

function initChannels() {
  initClientChannels();
  initBackgroundChannels();
}

// Initialize all proxy communication channels from the client to the background
// script.
function initClientChannels() {
  // Wallet Ethereum specific rpc requests.
  ContentScriptChannel.proxy(CHANNEL_ETHEREUM_RPC_REQUEST);
  ContentScriptChannel.proxy(CHANNEL_SOLANA_RPC_REQUEST);
  ContentScriptChannel.proxy(CHANNEL_TON_RPC_REQUEST);
}

// Initialize all communication channels from the background script to the client.
function initBackgroundChannels() {
  // Forward all notifications from the background script to the injected page.
  ContentScriptChannel.proxyReverse(
    CHANNEL_ETHEREUM_RPC_NOTIFICATION,
    CHANNEL_ETHEREUM_RPC_RESPONSE,
  );
  ContentScriptChannel.proxyReverse(
    CHANNEL_SOLANA_RPC_NOTIFICATION,
    CHANNEL_SOLANA_RPC_RESPONSE,
  );
  ContentScriptChannel.proxyReverse(
    CHANNEL_TON_RPC_NOTIFICATION,
    CHANNEL_TON_RPC_RESPONSE,
  );
}

main();
