import Dex from '@nestwallet/app/assets/images/dex.png';
import Light from '@nestwallet/app/assets/images/round-light.png';
import Image from 'next/image';
import { Root } from './root';

export function Feature0() {
  return (
    <Root>
      <div className='flex flex-col items-center'>
        <div
          className='-mt-80'
          style={{
            width: 800,
            height: 800,
          }}
        >
          <Image src={Light} alt='' width={800} height={800} />
        </div>
        <div className='-mt-[416px] flex flex-col items-center space-y-4'>
          <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
            <div className='text-primary text-center text-sm font-medium'>
              Pro Trading Tools
            </div>
          </div>
          <div className='flex flex-col space-y-2'>
            <div className='text-primary text-center text-4xl font-medium [text-shadow:_0_4px_12px_#EEF455]'>
              Browser Extension & Mobile
            </div>
            <div className='text-text-primary text-center text-2xl font-medium'>
              Start trading anywhere, anytime
            </div>
          </div>
        </div>
        <div className='bg-card/30 border-card-highlight mt-12 flex items-center justify-center rounded-3xl border px-8 py-8 backdrop-blur-sm'>
          <Image src={Dex} alt='' width={800} height={800} />
        </div>
      </div>
    </Root>
  );
}
