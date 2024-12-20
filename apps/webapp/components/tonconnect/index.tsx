import {
  faApple,
  faChrome,
  faGooglePlay,
} from '@fortawesome/free-brands-svg-icons';
import HeroBg from '@nestwallet/app/assets/images/home/hero/background.png';
import { adjust, withSize } from '@nestwallet/app/common/utils/style';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { QRCode } from '@nestwallet/app/components/qr';
import { ScanBorder } from '@nestwallet/app/components/scan';
import { colors } from '@nestwallet/app/design/constants';
import Image from 'next/image';
import { Linking } from 'react-native';
import {
  appStoreUrl,
  chromeWebStoreUrl,
  googlePlayStoreUrl,
} from '../home/utils';

interface TonConnectScreenProps {
  url: string;
}

export function TonConnectScreen(props: TonConnectScreenProps) {
  const { url } = props;

  return (
    <div className='flex h-full w-full flex-col items-center justify-center overflow-hidden'>
      <div className='absolute flex h-full w-full items-center justify-center overflow-hidden'>
        <div
          className='flex overflow-hidden'
          style={{ marginLeft: -500, height: 1250 }}
        >
          <Image src={HeroBg} alt={''} />
          <Image src={HeroBg} alt={''} />
          <Image src={HeroBg} alt={''} />
        </div>
      </div>
      <div className='flex w-full flex-col items-center justify-center space-y-4 lg:flex-row lg:space-x-6 lg:space-y-0'>
        <div className='bg-card flex w-[90%] max-w-[450px] flex-col items-center justify-center rounded-3xl backdrop-blur-sm md:h-full'>
          <div className='text-text-secondary flex h-full w-full flex-col space-y-3 px-10 py-10 text-sm md:text-lg'>
            <div className='text-text-primary mb-2 text-2xl'>
              Don't have Nest Wallet installed?
            </div>

            <div className='flex flex-row items-center space-x-2 '>
              <div className='text-text-primary font-bold'>Option 1:</div>
            </div>
            <div className='flex flex-row items-center space-x-2'>
              <div>1: Download the </div>
              <div className='text-primary font-bold'>Nest Wallet</div>
              <div>app</div>
            </div>
            <div className='flex flex-row items-center space-x-2'>
              <div>2: Click the open link button</div>
            </div>

            <div className='flex flex-row items-center space-x-2'>
              <div className='text-text-primary font-bold'>Option 2:</div>
            </div>
            <div className='flex flex-row items-center space-x-2'>
              <div>1: Download the </div>
              <div className='text-primary font-bold'>Nest Wallet</div>
              <div>app</div>
            </div>
            <div className='flex flex-row items-center space-x-2'>
              <div>2: Tap</div>
              <div
                className='border-text-primary flex items-center justify-center'
                style={withSize(adjust(20))}
              >
                <ScanBorder
                  size={adjust(18)}
                  length={6}
                  thickness={2}
                  color={colors.textPrimary}
                  radius={5}
                />
              </div>
              <div>to open the camera</div>
            </div>

            <div className='flex flex-row items-center space-x-2 '>
              <div>3: Scan the QR code</div>
            </div>
          </div>
          <div className='mb-10 flex w-full flex-col items-center justify-between space-y-4 px-6 md:flex-row  md:space-x-4 md:space-y-0'>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(chromeWebStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faChrome}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>Chrome</div>
              </div>
            </BaseButton>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(appStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faApple}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>iOS</div>
              </div>
            </BaseButton>
            <BaseButton
              className='w-full flex-1 overflow-hidden rounded-full md:w-auto md:max-w-xs'
              onPress={() => Linking.openURL(googlePlayStoreUrl)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-6 py-4 2xl:px-6 2xl:py-3'>
                <FontAwesomeIcon
                  color={colors.textButtonPrimary}
                  icon={faGooglePlay}
                  size={20}
                />
                <div className='text-sm font-bold text-slate-900'>Android</div>
              </div>
            </BaseButton>
          </div>
        </div>
        <>
          <div className='bg-text-secondary/50 flex h-full w-[2px] flex-col items-center justify-center rounded-full'></div>
          <div className='bg-card flex w-[90%] max-w-[450px] flex-col items-center justify-center rounded-3xl backdrop-blur-sm md:h-full'>
            <div
              className='m-10 flex items-center justify-around bg-white shadow'
              style={{
                height: 350,
                width: 350,
                borderRadius: 28,
              }}
            >
              <QRCode
                ecl={'M'}
                value={url}
                logo={'/images/nest-logo.svg' as any}
                logoSize={70}
                logoPadding={25}
                size={300}
              />
            </div>
            <BaseButton
              className='mb-10 w-full flex-1 overflow-hidden rounded-full'
              onPress={() => Linking.openURL(url)}
            >
              <div className='bg-primary flex w-full flex-row items-center justify-center space-x-2 rounded-full px-40 py-4 2xl:px-6 2xl:py-3'>
                <div className='text-sm font-bold text-slate-900'>
                  Open Link
                </div>
              </div>
            </BaseButton>
          </div>
        </>
      </div>
    </div>
  );
}
