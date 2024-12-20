import {
  ConnectedSite,
  ConnectedSitesData,
  Origin,
  SiteInfo,
} from '@nestwallet/app/common/types';
import { IWalletInfo } from '@nestwallet/app/features/wallet/service/interface';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { SessionService } from './session-service';

export class ConnectionService {
  private sessionService: SessionService;

  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public async getCurrentSite(): Promise<ConnectedSite | null> {
    const data = await this.sessionService.getUserSessionData();
    if (!data.site) {
      return null;
    }
    const url = new URL(data.site.url);
    const connectedSite = data.connections
      ? data.connections[url.origin]
      : undefined;
    return {
      connections: connectedSite?.connections ?? {},
      siteInfo: data.site,
    };
  }

  public async setCurrentSite(site?: SiteInfo) {
    const data = await this.sessionService.getUserSessionData();
    await this.sessionService.setUserSessionData({
      ...data,
      site,
    });
  }

  public async isCurrentSiteConnected(
    blockchain: IBlockchainType,
  ): Promise<boolean> {
    const data = await this.getCurrentSite();
    return data && data.siteInfo
      ? this.connection({ url: data.siteInfo.origin }, blockchain).then(
          (connection) => !!connection,
        )
      : false;
  }

  public async getConnectedSites(): Promise<ConnectedSitesData> {
    const data = await this.sessionService.getUserSessionData();
    return data.connections ?? {};
  }

  public async getConnectedSite(origin: string) {
    const connectedSites = await this.getConnectedSites();
    return connectedSites[origin];
  }

  public async removeConnectedSite(
    origin: string,
    blockchain?: IBlockchainType,
  ) {
    const data = await this.sessionService.getUserSessionData();
    const connectedSites = data.connections ?? {};
    if (!connectedSites[origin]) {
      return;
    } else if (!blockchain) {
      delete connectedSites[origin];
      await this.sessionService.setUserSessionData({
        ...data,
        connections: connectedSites,
      });
    } else if (connectedSites[origin]!.connections[blockchain]) {
      delete connectedSites[origin]!.connections[blockchain];
      await this.sessionService.setUserSessionData({
        ...data,
        connections: connectedSites,
      });
    }
  }

  public async removeConnectedSites() {
    const data = await this.sessionService.getUserSessionData();
    await this.sessionService.setUserSessionData({
      ...data,
      connections: {},
    });
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
    const data = await this.sessionService.getUserSessionData();
    const connectedSites = data.connections ?? {};
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
    await this.sessionService.setUserSessionData({
      ...data,
      connections: connectedSites,
    });
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
  public async updateBlockchainWallets(
    blockchain: IBlockchainType,
    wallet: IWalletInfo,
    chainId?: number,
  ) {
    const data = await this.sessionService.getUserSessionData();
    const connectedSites = data.connections ?? {};
    Object.keys(connectedSites).forEach((key) => {
      if (connectedSites[key]!.connections[blockchain]) {
        connectedSites[key]!.connections[blockchain]!.wallet = wallet;
        if (chainId) {
          connectedSites[key]!.connections[blockchain]!.chainId = chainId;
        }
      }
    });
    await this.sessionService.setUserSessionData({
      ...data,
      connections: connectedSites,
    });
  }
}
