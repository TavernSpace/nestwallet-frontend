import { ConnectedSitesData, Origin } from '@nestwallet/app/common/types';
import { IWalletInfo } from '@nestwallet/app/features/wallet/service/interface';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { Tabs, browser } from 'webextension-polyfill-ts';
import { BackgroundStorageKey } from '../../common/constants/worker/storage';
import { getLocalStorage, setLocalStorage } from '../../common/storage';

export class ConnectionService {
  public async getConnectedSites(): Promise<ConnectedSitesData> {
    const connectedSites = await getLocalStorage(
      BackgroundStorageKey.ConnectedSites,
    );
    return connectedSites ?? {};
  }

  public async getConnectedSite(origin: string) {
    const connectedSites = await this.getConnectedSites();
    return connectedSites[origin];
  }

  public async removeConnectedSite(
    origin: string,
    blockchain?: IBlockchainType,
  ) {
    const connectedSites = await this.getConnectedSites();
    if (!connectedSites[origin]) {
      return;
    } else if (!blockchain) {
      delete connectedSites[origin];
      return setLocalStorage(
        BackgroundStorageKey.ConnectedSites,
        connectedSites,
      );
    } else if (connectedSites[origin]!.connections[blockchain]) {
      delete connectedSites[origin]!.connections[blockchain];
      return setLocalStorage(
        BackgroundStorageKey.ConnectedSites,
        connectedSites,
      );
    }
  }

  public async removeConnectedSites() {
    const connectedSites = await this.getConnectedSites();
    await setLocalStorage(BackgroundStorageKey.ConnectedSites, {});
    return connectedSites;
  }

  public async addConnectedSite(input: {
    origin: string;
    title: string;
    imageUrl: string;
    wallet: IWalletInfo;
    chainId: number;
    blockchain: IBlockchainType;
  }) {
    const { origin, title, imageUrl, wallet, chainId, blockchain } = input;
    const connectedSites = await this.getConnectedSites();
    const site = connectedSites[origin];
    if (site) {
      connectedSites[origin] = {
        ...site,
        connections: {
          ...site.connections,
          [blockchain]: {
            wallet,
            chainId,
          },
        },
      };
    } else {
      connectedSites[origin] = {
        connections: {
          [blockchain]: {
            wallet,
            chainId,
          },
        },
        title,
        imageUrl,
      };
    }
    return setLocalStorage(BackgroundStorageKey.ConnectedSites, connectedSites);
  }

  public async connection(
    origin: Origin,
    blockchain: IBlockchainType,
  ): Promise<Origin | undefined> {
    if (!origin.url) return undefined;
    const site = await this.getConnectedSite(origin.url);
    return !!site && !!site.connections[blockchain]
      ? {
          title: site.title || origin.title,
          favIconUrl: site.imageUrl || origin.favIconUrl,
          url: origin.url,
        }
      : undefined;
  }

  public async getConnectedTabIds(blockchain: IBlockchainType) {
    const allTabs = await browser.tabs.query({});
    const validTabs = allTabs.filter((tab) => tab.id! && tab.url!);
    const connectedTabs = await Promise.all(
      validTabs.map(async (tab) => {
        const isConnected = await this.connection(
          { url: new URL(tab.url!).origin },
          blockchain,
        );
        return isConnected ? tab : null;
      }),
    );
    return connectedTabs
      .filter((tab): tab is Tabs.Tab => !!tab)
      .map((tab) => tab.id!);
  }

  public async updateBlockchainWallets(
    blockchain: IBlockchainType,
    wallet: IWalletInfo,
    chainId?: number,
  ) {
    const connectedSites = await this.getConnectedSites();
    Object.keys(connectedSites).forEach((key) => {
      if (connectedSites[key]!.connections[blockchain]) {
        connectedSites[key]!.connections[blockchain]!.wallet = wallet;
        if (chainId) {
          connectedSites[key]!.connections[blockchain]!.chainId = chainId;
        }
      }
    });
    setLocalStorage(BackgroundStorageKey.ConnectedSites, connectedSites);
  }
}
