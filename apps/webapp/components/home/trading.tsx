import Orbit from '@nestwallet/app/assets/images/orbit.png';
import Trade0 from '@nestwallet/app/assets/videos/home/trading/trade-0.mp4';
import Trade1 from '@nestwallet/app/assets/videos/home/trading/trade-1.mp4';
import Trade2 from '@nestwallet/app/assets/videos/home/trading/trade-2.mp4';
import Trade3 from '@nestwallet/app/assets/videos/home/trading/trade-3.mp4';
import Trade4 from '@nestwallet/app/assets/videos/home/trading/trade-4.mp4';
import { delay } from '@nestwallet/app/common/api/utils';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Root } from './root';
import { useScreenSize } from './utils';

export function Trading() {
  const [showMobileView, setShowMobileView] = useState(false);

  const [containerTranslateY, setContainerTranslateY] = useState(0);
  const [containerOpacity, setContainerOpacity] = useState(100);

  const [buttonBgTranslateX, setButtonBgTranslateX] = useState(0);
  const buttonBgRef = useRef<HTMLDivElement>(null);
  const buttonBgWidth = buttonBgRef.current?.offsetWidth;

  const [iconRotation, setIconRotation] = useState(0);
  const screenSize = useScreenSize();

  const handleSwitchTabs = async () => {
    setContainerTranslateY(150);
    setContainerOpacity(0);
    setIconRotation(iconRotation + 720);
    setButtonBgTranslateX(buttonBgTranslateX > 0 ? 0 : buttonBgWidth!);
    await delay(100);
    setShowMobileView(!showMobileView);
    await delay(100); //Give time for video to render on mobile. Should we just always have the video rendered instead?
    setContainerTranslateY(0);
    setContainerOpacity(100);
  };
  useEffect(() => {
    //Buttonbg can get missaligned when resizing screen. This is the fix
    setButtonBgTranslateX(buttonBgTranslateX > 0 ? buttonBgWidth! : 0);
  }, [screenSize]);

  return (
    <div className='border-t-card-highlight from-card to-background mt-24 flex w-full flex-col items-center border-t bg-gradient-to-b'>
      <div
        className=''
        style={{
          width: 800,
          height: 800,
        }}
      >
        <Image src={Orbit} alt='' width={800} height={800} />
      </div>
      <Root>
        <div className='-mt-[700px] flex flex-col items-center'>
          <div className='flex flex-col items-center space-y-4'>
            <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
              <div className='text-primary text-center text-sm font-medium'>
                The Ultimate Degen App
              </div>
            </div>
            <div className='flex flex-col space-y-2'>
              <div className='text-primary text-center text-4xl font-medium [text-shadow:_0_4px_12px_#EEF455]'>
                Trade Like a Pro
              </div>
              <div className='text-text-primary text-center text-2xl font-medium'>
                All the tools you need to trade like a pro
              </div>
            </div>
          </div>
        </div>
        <div className='item-center item-center mt-12 flex flex-row flex-wrap justify-center'>
          <div className='m-3 w-fit overflow-hidden rounded-xl'>
            <video
              src={Trade0}
              className='w-full max-w-sm'
              autoPlay={true}
              playsInline={true}
              muted={true}
              loop={true}
            />
          </div>
          <div className='m-3 w-fit overflow-hidden rounded-xl'>
            <video
              src={Trade1}
              className='w-full max-w-sm'
              autoPlay={true}
              playsInline={true}
              muted={true}
              loop={true}
            />
          </div>
          <div className='m-3 w-fit overflow-hidden rounded-xl'>
            <video
              src={Trade2}
              className='w-full max-w-sm'
              autoPlay={true}
              playsInline={true}
              muted={true}
              loop={true}
            />
          </div>
          <div className='m-3 w-fit overflow-hidden rounded-xl'>
            <video
              src={Trade3}
              className='w-full max-w-sm'
              autoPlay={true}
              playsInline={true}
              muted={true}
              loop={true}
            />
          </div>
          <div className='m-3 w-fit overflow-hidden rounded-xl'>
            <video
              src={Trade4}
              className='w-full max-w-sm'
              autoPlay={true}
              playsInline={true}
              muted={true}
              loop={true}
            />
          </div>
        </div>
      </Root>
    </div>
  );
}
