import {
  faApple,
  faChrome,
  faGooglePlay,
} from '@fortawesome/free-brands-svg-icons';
import App from '@nestwallet/app/assets/images/home/app.png';
import Grid from '@nestwallet/app/assets/images/home/grid.png';
import Light from '@nestwallet/app/assets/images/home/light.png';
import { GeoInfo, fetchGeoInfo } from '@nestwallet/app/common/api/geo';
import { opacity } from '@nestwallet/app/common/utils/functions';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { colors } from '@nestwallet/app/design/constants';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Linking } from 'react-native';
import { Root } from './root';
import {
  adjustWeb,
  appStoreUrl,
  chromeWebStoreUrl,
  googlePlayStoreUrl,
  useScreenSize,
} from './utils';

const disallowedCountryCodes = ['CN', 'KP', 'SY', 'IR'];

export function Hero() {
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const screenSize = useScreenSize();

  useEffect(() => {
    const loadGeoInfo = async () => {
      const fetchedGeoInfo = await fetchGeoInfo();
      setGeoInfo(fetchedGeoInfo);
    };

    loadGeoInfo();
  }, []);

  const handleOpenURL = async (url: string) => {
    if (!geoInfo) {
      return;
    }

    if (disallowedCountryCodes.includes(geoInfo.country_code)) {
      const message = `Sorry, this app is not available in your jurisdiction: ${geoInfo.country_name}`;
      alert(message);
      return;
    }
    return Linking.openURL(url);
  };

  return (
    <Root>
      <Image
        className='absolute -top-48 right-0 min-h-[520px] md:-top-96 xl:-right-8'
        style={{ zIndex: 20 }}
        src={Light}
        alt=''
        width={490 * 3}
        height={570 * 3}
      />
      <div
        className='absolute left-40 top-0 flex flex-row overflow-hidden opacity-50'
        style={{ zIndex: 10 }}
      >
        <Image src={Grid} alt='' />
      </div>
      <div className='z-50 w-full items-center justify-between py-8 xl:pb-8'>
        <div className='z-50 flex flex-col items-center space-y-8 xl:flex-row xl:items-start xl:justify-between xl:space-y-0'>
          <div className='z-50 max-w-4xl xl:pt-32'>
            <div className='text-text-primary max-w-[400px] text-center text-2xl font-medium sm:text-5xl md:text-left'>
              The Ultimate Trading Wallet with{' '}
              <span className='text-primary [text-shadow:_0_4px_12px_#EEF455]'>
                Zero Fees
              </span>
            </div>
            <div className='flex flex-col items-center md:items-start'>
              <div>
                <div className='text-text-secondary mt-6 text-center text-sm sm:text-base md:text-left'>
                  Supports:
                </div>
                <div className='mt-3 flex flex-row items-center justify-center gap-2 md:justify-start'>
                  <ChainIcon
                    color={colors.solana}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg'
                  />
                  <ChainIcon
                    color={colors.ton}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ton.svg'
                  />
                  <ChainIcon
                    color={colors.ethereum}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ethereum.svg'
                  />
                  <ChainIcon
                    color={colors.base}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/base.svg'
                  />
                  <ChainIcon
                    color={colors.bsc}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/bsc.svg'
                  />
                  <ChainIcon
                    color={colors.scroll}
                    url='https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/scroll.svg'
                  />
                  <ChainIcon text='9+' />
                </div>
              </div>

              <div>
                <div className='text-text-secondary mt-4 hidden text-center text-sm sm:text-base md:block md:text-left'>
                  Download For:
                </div>
                <div className='mt-3 flex w-80 flex-row items-center justify-between space-x-2 sm:mt-10 sm:justify-center md:mt-3 md:justify-start'>
                  <BaseButton
                    className='flex-1'
                    onPress={() => handleOpenURL(chromeWebStoreUrl)}
                  >
                    <div className='bg-primary flex h-10 flex-row items-center justify-center space-x-2 rounded-xl sm:py-4'>
                      <FontAwesomeIcon
                        color={colors.textButtonPrimary}
                        icon={faChrome}
                        size={adjustWeb(22, screenSize, 0.75)}
                      />
                      <div className='text-xs font-bold text-black sm:text-base md:text-sm'>
                        Chrome
                      </div>
                    </div>
                  </BaseButton>
                  <BaseButton
                    className='flex-1'
                    onPress={() => handleOpenURL(appStoreUrl)}
                  >
                    <div className='bg-primary flex h-10 flex-row items-center justify-center space-x-2 rounded-xl sm:py-4'>
                      <FontAwesomeIcon
                        color={colors.textButtonPrimary}
                        icon={faApple}
                        size={adjustWeb(22, screenSize, 0.75)}
                      />
                      <div className='text-xs font-bold text-black sm:text-base md:text-sm'>
                        iOS
                      </div>
                    </div>
                  </BaseButton>
                  <BaseButton
                    className='flex-1'
                    onPress={() => handleOpenURL(googlePlayStoreUrl)}
                  >
                    <div className='bg-primary flex h-10 flex-row items-center justify-center space-x-2 rounded-xl sm:py-4'>
                      <FontAwesomeIcon
                        color={colors.textButtonPrimary}
                        icon={faGooglePlay}
                        size={adjustWeb(22, screenSize, 0.75)}
                      />
                      <div className='text-xs font-bold text-black sm:text-base md:text-sm'>
                        Android
                      </div>
                    </div>
                  </BaseButton>
                </div>
              </div>
            </div>
          </div>
          <div className='z-50 flex min-w-[500px] items-center justify-center'>
            <Image src={App} alt='' width={800} height={650} />
          </div>
        </div>
      </div>
    </Root>
  );
}

function ChainIcon(props: { color?: string; url?: string; text?: string }) {
  const { color, url, text } = props;

  return (
    <div
      className='h-9 w-9 rounded-lg'
      style={{
        backgroundColor: color
          ? opacity(color, 20)
          : opacity(colors.cardHighlight, 80),
      }}
    >
      {!!url && (
        <img className='h-full w-full object-contain p-1' src={url} alt={''} />
      )}
      {!!text && (
        <div className='text-text-secondary flex h-full w-full items-center justify-center object-contain text-base font-medium'>
          {text}
        </div>
      )}
    </div>
  );
}
