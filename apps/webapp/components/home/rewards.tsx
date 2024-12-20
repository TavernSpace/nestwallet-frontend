import BottomShine from '@nestwallet/app/assets/images/bottom-shine.png';
import Evolution from '@nestwallet/app/assets/images/evolution.png';
import Image from 'next/image';
import { Root } from './root';

export function Rewards() {
  return (
    <div className='mt-24 flex w-full flex-col items-center'>
      <Root>
        <div className='flex flex-col items-center'>
          <div className='z-50 flex flex-col items-center'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
                <div className='text-primary text-center text-sm font-medium'>
                  Nest Rewards
                </div>
              </div>
              <div className='flex flex-col space-y-2'>
                <div className='text-primary text-center text-4xl font-medium [text-shadow:_0_4px_12px_#EEF455]'>
                  Earn XP on Every Transaction
                </div>
                <div className='text-text-primary text-center text-2xl font-medium'>
                  Join the Nest Odyssey and begin earning rewards
                </div>
              </div>
            </div>
          </div>
          <div className='z-50 min-w-[500px]'>
            <Image src={Evolution} alt='' width={800} height={800} />
          </div>
        </div>
      </Root>
      <div
        className='z-10 -mt-[560px]'
        style={{
          width: 1920,
          height: 900,
        }}
      >
        <Image src={BottomShine} alt='' width={1920} height={900} />
      </div>
    </div>
  );
}
