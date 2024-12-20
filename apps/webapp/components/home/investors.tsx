import bitgoLogo from '@nestwallet/app/assets/images/home/investors/bitgo.png';
import googleLogo from '@nestwallet/app/assets/images/home/investors/google.png';
import gumiLogo from '@nestwallet/app/assets/images/home/investors/gumi.png';
import opLogo from '@nestwallet/app/assets/images/home/investors/inception.png';
import jumpLogo from '@nestwallet/app/assets/images/home/investors/jumptrading.png';
import linkedinLogo from '@nestwallet/app/assets/images/home/investors/linkedin.png';
import orangedaoLogo from '@nestwallet/app/assets/images/home/investors/orangedao.png';
import sandboxLogo from '@nestwallet/app/assets/images/home/investors/sandbox.png';
import stanfordLogo from '@nestwallet/app/assets/images/home/investors/stanford.png';
import twitchLogo from '@nestwallet/app/assets/images/home/investors/twitch.png';
import upennLogo from '@nestwallet/app/assets/images/home/investors/upenn.png';
import youtubeLogo from '@nestwallet/app/assets/images/home/investors/youtube.png';
import Image from 'next/image';

const builders = [
  bitgoLogo,
  googleLogo,
  jumpLogo,
  linkedinLogo,
  upennLogo,
  stanfordLogo,
];

const investors = [
  gumiLogo,
  opLogo,
  orangedaoLogo,
  sandboxLogo,
  twitchLogo,
  youtubeLogo,
];

export function InvestorLogoCloud() {
  return (
    <div className='bg-card border-primary/10 z-50 mt-6 flex w-full flex-row justify-center border-b border-t px-8 py-4'>
      <div className='flex w-full max-w-7xl flex-col space-y-16 lg:flex-row lg:space-x-4 lg:space-y-0'>
        <div className='flex flex-1 justify-center'>
          <div className='flex w-full max-w-4xl flex-col items-center justify-center'>
            <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
              <div className='text-primary text-center text-sm font-medium'>
                Backed by the Best
              </div>
            </div>
            <div className='grid-2 mt-2 flex flex-col items-center space-x-4 sm:flex-row'>
              {investors.map((logoUrl, index) => (
                <div key={index} className='flex w-full justify-center'>
                  <Image
                    className='object-contain'
                    src={logoUrl}
                    alt=''
                    width={140}
                    height={48}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
