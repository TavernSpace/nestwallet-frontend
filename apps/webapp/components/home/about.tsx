import Beacon from '@nestwallet/app/assets/images/beacon.png';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Root } from './root';
import { adjustWeb, useScreenSize } from './utils';

//  https://github.com/cookpete/react-player/issues/1428#issuecomment-1107908096
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

export function About() {
  const screenSize = useScreenSize();

  return (
    <div className='flex flex-col items-center'>
      <div
        className='z-10 -mt-[205px]'
        style={{
          width: 1920,
          height: 900,
        }}
      >
        <Image src={Beacon} alt='' width={1920} height={900} />
      </div>
      <Root>
        <div className='z-50 -mt-[460px] flex flex-col items-center px-16'>
          <div className='bg-primary/20 z-50 w-fit rounded-full px-4 py-1.5'>
            <div className='text-primary text-center text-sm font-medium'>
              About Us
            </div>
          </div>
          <div className='bg-card/80 border-card-highlight z-50 mx-4 mt-12 rounded-3xl border px-8 py-8 backdrop-blur-sm'>
            <ReactPlayer
              width={adjustWeb(1024, screenSize, 0.35, 0.5, 0.6)}
              height={adjustWeb(576, screenSize, 0.35, 0.5, 0.6)}
              controls={true}
              url='https://www.youtube.com/watch?v=qN0A0DKpWdg'
            />
          </div>
        </div>
      </Root>
    </div>
  );
}
