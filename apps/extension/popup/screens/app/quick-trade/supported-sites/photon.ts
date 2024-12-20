import { ChainId } from '@nestwallet/app/features/chain';
import { fetchDecimals } from '@nestwallet/app/features/crypto/balance';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';
import { getAddress, isAddress } from 'ethers';

export interface PhotonSiteData {
  isPhoton: boolean;
  chainId?: number;
  pool?: string;
}

export interface PhotonScrapeResult {
  price?: string;
  symbol?: string;
  name?: string;
  address?: string;
  pool?: string;
  imageLink?: string;
}

export async function getPhotonToken(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  const photonData = parsePhotonUrl(url);
  if (photonData.isPhoton) {
    if (!url || !photonData.chainId || !photonData.pool) {
      return;
    }
    const { price, symbol, name, address, imageLink } = await scrapePhoton(url);
    if (!symbol || !name || !address) {
      return;
    }
    const chainId = photonData.chainId;
    const decimals = await fetchDecimals(chainId, address);
    const parsedPrice = price?.replace('$', '').trim();
    const parsedSymbol = symbol.trim();
    const parsedName = name.trim();
    const token: BasicTokenInfo = {
      symbol: parsedSymbol,
      name: parsedName,
      logo: imageLink,
      price: parsedPrice,
      chainId,
      address,
      decimals,
    };
    return token;
  } else {
    return;
  }
}

//photon has eth, base, blast, sol (we don't have blast or sol yet for quicktrade)
function parsePhotonUrl(url?: string): PhotonSiteData {
  //eg: https://photon-blast.tinyastro.io/en/lp/0xf10ef2c62d0a88cfa4fa131a2792ccb9b4ee815f?handle=6472352b4d118d7978ed
  // https://photon.tinyastro.io/en/lp/0x96e2472d201ad6016edf949c2c41adf2ce33c403?handle=6472352b4d118d7978ed
  // https://photon-base.tinyastro.io/en/lp/0x31d67cf29e53328ee8021b3af2d5c50b37b7e7ff?handle=6472352b4d118d7978ed
  const ethPrefix = 'https://photon.tinyastro.io';
  const basePrefix = 'https://photon-base.tinyastro.io';
  const blastPrefix = 'https://photon-blast.tinyastro.io';
  const solPrefix = 'https://photon-sol.tinyastro.io';
  if (!url) {
    return {
      isPhoton: false,
    };
  }
  const isPhotonEth = url.startsWith(ethPrefix);
  const isPhotonBase = url.startsWith(basePrefix);
  const isPhotonBlast = url.startsWith(blastPrefix);
  const isPhotonSol = url.startsWith(solPrefix);
  if (!isPhotonEth && !isPhotonBase && !isPhotonBlast && !isPhotonSol) {
    return {
      isPhoton: false,
    };
  }
  if (isPhotonEth) {
    const [_, poolAndHandle] = url.slice(ethPrefix.length + 1).split('/lp/');
    const pool = poolAndHandle?.split('?handle=')[0];
    return {
      isPhoton: true,
      chainId: ChainId.Ethereum,
      pool: isAddress(pool) ? getAddress(pool) : undefined,
    };
  }

  if (isPhotonBase) {
    const [_, poolAndHandle] = url.slice(basePrefix.length + 1).split('/lp/');
    const pool = poolAndHandle?.split('?handle=')[0];
    return {
      isPhoton: true,
      chainId: ChainId.Base,
      pool: isAddress(pool) ? getAddress(pool) : undefined,
    };
  }

  if (isPhotonSol) {
    const [_, poolAndHandle] = url.slice(solPrefix.length + 1).split('/lp/');
    const pool = poolAndHandle?.split('?handle=')[0];
    return {
      isPhoton: true,
      chainId: ChainId.Solana,
      pool: pool,
    };
  }

  if (isPhotonBlast) {
    const [_, poolAndHandle] = url.slice(blastPrefix.length + 1).split('/lp/');
    const pool = poolAndHandle?.split('?handle=')[0];
    return {
      isPhoton: true,
      chainId: undefined,
      pool: undefined, //blast is not supported yet for quicktrade on our side
    };
  }
  return {
    isPhoton: true, //double check this when testing
  };
}

const scrapePhoton = async (url: string): Promise<PhotonScrapeResult> => {
  const { pool, chainId } = parsePhotonUrl(url);
  return new Promise((resolve, reject) => {
    const attemptScraping = (tabId: number, attempts = 0) => {
      const isSolana = chainId === ChainId.Solana;
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: scrapePhotonScript,
          args: [isSolana],
        },
        (injectionResults) => {
          for (const result of injectionResults) {
            const price = result.result?.price;
            const symbol = result.result?.symbol;
            const name = result.result?.name;
            const imageLink = result.result?.imageLink;
            const address = result.result?.address;
            const scrapedPool = result.result?.pool;
            const newPool = isSolana
              ? scrapedPool
              : isAddress(scrapedPool)
              ? getAddress(scrapedPool)
              : undefined;
            if (pool === newPool) {
              resolve({
                price: price,
                symbol: symbol,
                name: name,
                address: address,
                imageLink: imageLink,
              });
            } else {
              if (attempts < 10) {
                setTimeout(() => attemptScraping(tabId, attempts + 1), 500);
              } else {
                resolve({
                  price: price,
                  symbol: symbol,
                  name: name,
                  address: address,
                  imageLink: imageLink,
                });
              }
            }
          }
        },
      );
    };

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab) {
        const tabId = tab.id ?? 0;
        attemptScraping(tabId, 0);
      } else {
        resolve({
          price: undefined,
          symbol: undefined,
          name: undefined,
          address: undefined,
          imageLink: undefined,
        });
      }
    });
  });
};

function scrapePhotonScript(isSolana: boolean): Promise<PhotonScrapeResult> {
  return new Promise<PhotonScrapeResult>(
    (
      resolve: (result: PhotonScrapeResult) => void,
      reject: (reason?: any) => void,
    ) => {
      setTimeout(() => {
        const mainPath = isSolana
          ? '//html/body/div[7]/div[9]/div'
          : '//html/body/div[6]/div[4]/div';

        const poolPath = mainPath + '/div[2]/div/div/div/div/div/div[2]/div[3]';
        const poolElement = document.evaluate(
          poolPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const pool =
          (poolElement.singleNodeValue as Element)?.getAttribute(
            'data-address',
          ) || undefined;

        const addressPath = mainPath + '/div[2]/div/div/div/div/div/div[2]/div';
        const addressElement = document.evaluate(
          addressPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const address =
          (addressElement.singleNodeValue as Element)?.getAttribute(
            'data-address',
          ) || undefined;

        const symbolPath = isSolana
          ? mainPath + '/div/div/div/div[2]/div/div/div'
          : mainPath + '/div/div/div/div/div/div/div';
        const symbolElement = document.evaluate(
          symbolPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const symbol =
          (symbolElement.singleNodeValue as Element)?.textContent || undefined;

        const namePath = isSolana
          ? mainPath + '/div[2]/div/div/div/div/div/div/div/div'
          : mainPath + '/div[2]/div/div/div/div/div/div/div/div/div/div';
        const nameElement = document.evaluate(
          namePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const name =
          (nameElement.singleNodeValue as Element)?.textContent || symbol;

        const pricePath = isSolana
          ? mainPath + '/div/div/div/div[4]/div/div[2]'
          : mainPath + '/div/div/div/div[3]/div/div[2]';
        const priceElement = document.evaluate(
          pricePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const price =
          (priceElement.singleNodeValue as Element)?.getAttribute(
            'data-value',
          ) || undefined;

        //image only on solana
        const imagePath =
          mainPath + '/div[2]/div/div/div/div/div/div/div/div/img';
        const imageElement = document.evaluate(
          imagePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const imageLink =
          (imageElement.singleNodeValue as Element)?.getAttribute('src') ||
          undefined;

        resolve({
          address: address,
          price: price,
          symbol: symbol,
          name: name,
          pool: pool,
          imageLink: imageLink,
        });
      }, 1000);
    },
  );
}
