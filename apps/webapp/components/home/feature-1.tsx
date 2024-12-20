import Light from '@nestwallet/app/assets/images/round-light.png';
import Trade from '@nestwallet/app/assets/images/trade-panels.png';
import Image from 'next/image';
import { Root } from './root';

export function Feature1() {
  return (
    <Root>
      <div className='flex flex-col items-center'>
        <div
          className='-mt-96'
          style={{
            width: 800,
            height: 800,
          }}
        >
          <Image src={Light} alt='' width={800} height={800} />
        </div>
        <div className='-mt-80 flex flex-col items-center'>
          <div className='flex flex-col items-center space-y-4'>
            <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
              <div className='text-primary text-center text-sm font-medium'>
                Stellar Mobile Experience
              </div>
            </div>
            <div className='flex flex-col space-y-2'>
              <div className='text-primary text-center text-4xl font-medium [text-shadow:_0_4px_12px_#EEF455]'>
                Tools Focused For Traders
              </div>
              <div className='text-text-primary text-center text-2xl font-medium'>
                Built by degens, for degens
              </div>
            </div>
          </div>
          <div className='bg-card/30 border-card-highlight mt-12 flex w-full items-center justify-center rounded-3xl border px-8 py-8 backdrop-blur-sm'>
            <Image src={Trade} alt='' width={800} height={800} />
          </div>
        </div>
      </div>
    </Root>
  );
}
