import { parseDexScreenerTokenUrl } from '@nestwallet/app/common/api/dexscreener/utils';
import {
  makeLoadable,
  makeLoadableError,
} from '@nestwallet/app/common/utils/query';
import { ICryptoBalance } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNestWallet, WindowType } from '@nestwallet/app/provider/nestwallet';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';
import html2canvas from 'html2canvas';
import { useEffect, useState } from 'react';
import { getBirdEyeToken } from './supported-sites/birdeye';
import { getFourMemeToken } from './supported-sites/fourmeme';
import { getGasPumpToken } from './supported-sites/gaspump';
import { getPhotonToken } from './supported-sites/photon';
import { getPumpFunToken } from './supported-sites/pump-fun';

export interface QuickTradeSiteData {
  quickTradeSupported: boolean;
  isDexScreener: boolean;
  isBirdEye: boolean;
  isPhoton: boolean;
  chainId?: number;
  address?: string;
}

export async function parseQuickTradeUrl(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  if (!url) {
    return;
  }
  const birdEyeToken = await getBirdEyeToken(url);
  if (birdEyeToken) {
    return birdEyeToken;
  }
  const photonToken = await getPhotonToken(url);
  if (photonToken) {
    return photonToken;
  }
  const dexScreenerToken = await parseDexScreenerTokenUrl(url);
  if (dexScreenerToken) {
    return dexScreenerToken;
  }
  const pumpFunToken = await getPumpFunToken(url);
  if (pumpFunToken) {
    return pumpFunToken;
  }
  const gasPumpToken = await getGasPumpToken(url);
  if (gasPumpToken) {
    return gasPumpToken;
  }
  const fourMemeToken = await getFourMemeToken(url);
  if (fourMemeToken) {
    return fourMemeToken;
  }
  return;
}

export function useExternalAsset(initialAsset?: ICryptoBalance) {
  const { windowType } = useNestWallet();
  const { showSnackbar } = useSnackbar();

  const [url, setUrl] = useState<string>();
  const [primaryAsset, setPrimaryAsset] = useState<BasicTokenInfo>();

  const trackSite =
    windowType !== WindowType.tab && windowType !== WindowType.window;

  const initialize = async () => {
    try {
      if (initialAsset) return;
      // TODO: handle loading, this should generally be extremely fast so don't think we need a loading state
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const currentTab = tabs[0];
      setUrl(currentTab?.url);
    } catch {
      // TODO: handle error
    }
  };

  const handleQuickTradeUrlChange = async (url?: string) => {
    try {
      const data = await parseQuickTradeUrl(url);
      if (!data) {
        return;
      } else if (
        data.address !== primaryAsset?.address ||
        data.chainId !== primaryAsset.chainId
      ) {
        setPrimaryAsset(data);
      }
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Unable to get token data from site',
      });
    }
  };

  useEffect(() => {
    if (!trackSite) return;
    initialize();
    const handleTabChange = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      const window = await chrome.windows.getCurrent();
      if (tab.active && tab.windowId === window.id && changeInfo.url) {
        setUrl(tab.url || tab.pendingUrl);
      }
    };
    const handleTabActivated = async (
      activeInfo: chrome.tabs.TabActiveInfo,
    ) => {
      const [window, tab] = await Promise.all([
        chrome.windows.getCurrent(),
        chrome.tabs.get(activeInfo.tabId),
      ]);
      if (window.id === tab.windowId) {
        setUrl(tab.url);
      }
    };
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.tabs.onUpdated.addListener(handleTabChange);
    return () => {
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.tabs.onUpdated.removeListener(handleTabChange);
    };
  }, []);

  // Note: we do this indirectly because sometimes extra tab update events are emitted and cause rendering issues
  // Also, we don't want the capture in the event listener to be stale
  useEffect(() => {
    handleQuickTradeUrlChange(url);
  }, [url]);

  return primaryAsset ? makeLoadable(primaryAsset) : makeLoadableError();
}

export function useShare() {
  const { showSnackbar } = useSnackbar();

  const share =
    (token: ICryptoBalance) =>
    async (viewRef: React.MutableRefObject<null>) => {
      try {
        const canvas = await html2canvas(
          viewRef.current as unknown as HTMLElement,
          { useCORS: true },
        );
        const uri = canvas.toDataURL();
        downloadURI(uri, `nestwallet_${token.tokenMetadata.symbol}_pnl.jpg`);
      } catch (err) {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: 'Unable to download your PnL, please try again',
        });
      }
    };

  const downloadURI = (uri: string, filename: string) => {
    const link = document.createElement('a');
    link.href = uri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return { share };
}
