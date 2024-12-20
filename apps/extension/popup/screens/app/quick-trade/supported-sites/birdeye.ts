import { birdEyeChainMap } from '@nestwallet/app/common/api/birdeye/utils';
import { ChainId } from '@nestwallet/app/features/chain';
import { fetchDecimals } from '@nestwallet/app/features/crypto/balance';
import { isEVMAddress } from '@nestwallet/app/features/evm/utils';
import { BasicTokenInfo } from '@nestwallet/app/screens/quick-trade/types';
import { getAddress } from 'ethers';

export interface BirdEyeSiteData {
  isBirdEye: boolean;
  chainId?: number;
  address?: string;
}

export interface BirdEyeScrapeResult {
  imageLink?: string;
  price?: string;
  symbol?: string;
  name?: string;
  address?: string;
  overview?: string;
}

export async function getBirdEyeToken(
  url?: string,
): Promise<BasicTokenInfo | undefined> {
  const birdEyeData = parseBirdEyeUrl(url);
  if (birdEyeData.isBirdEye) {
    if (!url || !birdEyeData.chainId || !birdEyeData.address) {
      return;
    }
    const { imageLink, price, symbol, name } = await scrapeBirdEye(url);
    const chainId = birdEyeData.chainId;
    const address = birdEyeData.address;
    if (!symbol || !name) {
      return;
    }
    const decimals = await fetchDecimals(chainId, address);
    const token: BasicTokenInfo = {
      symbol,
      name,
      logo: imageLink,
      price,
      chainId,
      address,
      decimals,
    };
    return token;
  } else {
    return;
  }
}

function parseBirdEyeUrl(url?: string): BirdEyeSiteData {
  //eg: https://birdeye.so/token/0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6?chain=polygon  OR
  // https://birdeye.so/token/0x61fFE097137d543f019F5257E1a1Ff7A6C5F0b68/0x0B1cCbA98Ea1c282cE3280571400e25c1e4f8A9b?chain=polygon
  const prefix = 'https://birdeye.so/token';
  if (!url) {
    return {
      isBirdEye: false,
    };
  }
  const isBirdEye = url.startsWith(prefix);
  if (!isBirdEye) {
    return {
      isBirdEye: false,
    };
  }
  const [addr, chain] = url.slice(prefix.length + 1).split('?chain=');
  const newAddr = addr?.split('/')[0]; //handling case where link contains two addresses
  return {
    isBirdEye: true,
    chainId: chain ? birdEyeChainMap[chain] : undefined,
    address: !newAddr
      ? undefined
      : isEVMAddress(newAddr)
      ? getAddress(newAddr)
      : newAddr,
  };
}

const scrapeBirdEye = async (url: string): Promise<BirdEyeScrapeResult> => {
  const { address, chainId } = parseBirdEyeUrl(url);
  return new Promise((resolve, reject) => {
    const attemptScraping = (tabId: number, attempts = 0) => {
      const isSolana = chainId === ChainId.Solana;
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          func: scrapeBirdEyeScript,
          args: [isSolana],
        },
        (injectionResults) => {
          for (const result of injectionResults) {
            const overview = result.result?.overview;
            const logo = result.result?.imageLink;
            const price = result.result?.price;
            const symbol = result.result?.symbol;
            const name = result.result?.name;
            const newAddress = result.result?.address;
            const parsedAddress = newAddress?.split('token/')[1];

            if (parsedAddress === address && overview === 'Overview') {
              resolve({
                price: price,
                symbol: symbol,
                name: name,
                imageLink: logo,
              });
            } else {
              if (attempts < 10) {
                setTimeout(() => attemptScraping(tabId, attempts + 1), 500);
              } else {
                resolve({
                  imageLink: logo,
                  price: price,
                  symbol: symbol,
                  name: name,
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
          imageLink: undefined,
          price: undefined,
          symbol: undefined,
          name: undefined,
        });
      }
    });
  });
};

function scrapeBirdEyeScript(isSolana: boolean): Promise<BirdEyeScrapeResult> {
  return new Promise<BirdEyeScrapeResult>(
    (
      resolve: (result: BirdEyeScrapeResult) => void,
      reject: (reason?: any) => void,
    ) => {
      function parseBirdEyeStringtoPrice(input: string): string {
        //birdeye comrpesses zeroes using exponents
        const subscriptsList = [
          '₀',
          '₁',
          '₂',
          '₃',
          '₄',
          '₅',
          '₆',
          '₇',
          '₈',
          '₉',
        ];
        const nonSubscriptsList = [
          '1',
          '2',
          '3',
          '4',
          '5',
          '6',
          '7',
          '8',
          '9',
          '0',
          '.',
        ];
        let subscript = 0;
        let result = '';
        for (const char of input) {
          if (subscriptsList.includes(char)) {
            subscript = subscript * 10 + subscriptsList.indexOf(char);
          } else if (nonSubscriptsList.includes(char)) {
            result += char;
          }
        }
        if (subscript == 0) {
          return result;
        }
        subscript -= 1;
        return (parseFloat(result) * 10 ** -subscript).toString();
      }

      setTimeout(() => {
        //Scraping
        const overviewPath =
          '//html/body/div/div/div[2]/div/div[2]/div/div[2]/div/div/div/div';
        const overviewElement = document.evaluate(
          overviewPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const overview =
          (overviewElement.singleNodeValue as Element)?.textContent ||
          undefined;

        const mainPath =
          '//html/body/div/div/div[2]/div/div[2]/div/div[2]/div/div/div/div[2]';

        const imagePath = mainPath + '/div/div/span/div[2]/img[2]';
        const backupImagePath = mainPath + '/div/div/span/div[2]/img';
        const imageElement = document.evaluate(
          imagePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const backupImageElement = document.evaluate(
          backupImagePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const imageLink =
          (imageElement.singleNodeValue as Element)?.getAttribute('src') ||
          (backupImageElement.singleNodeValue as Element)?.getAttribute(
            'src',
          ) ||
          undefined;

        const symbolPath = mainPath + '/div/div/span/span';
        const symbolElement = document.evaluate(
          symbolPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const symbol =
          (symbolElement.singleNodeValue as Element)?.textContent || undefined;

        const pricePath = mainPath + '/div/div/span[2]';
        const priceElement = document.evaluate(
          pricePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        let price =
          (priceElement.singleNodeValue as Element)?.textContent || undefined;
        price = price ? parseBirdEyeStringtoPrice(price) : undefined;

        const namePath = isSolana
          ? mainPath + '/div[5]/div[2]'
          : mainPath + '/div[4]/div[2]';
        const nameElement = document.evaluate(
          namePath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const name =
          (nameElement.singleNodeValue as Element)?.textContent || undefined;

        const addressPath = isSolana
          ? mainPath + '/div[6]/div[2]/span/a'
          : mainPath + '/div[5]/div[2]/span/a';
        const addressElement = document.evaluate(
          addressPath,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        const address =
          (addressElement.singleNodeValue as Element)?.getAttribute('href') ||
          undefined;
        resolve({ imageLink, symbol, price, name, address, overview });
      }, 1000); //wait for 1 second after matched addresses to ensure everything is fully loaded
    },
  );
}
