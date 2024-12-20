import { faGamepad } from '@fortawesome/pro-solid-svg-icons';
import glow from '@nestwallet/app/assets/images/home/glow.png';
import grid from '@nestwallet/app/assets/images/home/grid.png';
import heroBg from '@nestwallet/app/assets/images/home/hero/background.png';
import card1 from '@nestwallet/app/assets/videos/home/tools/video-card-1.mp4';
import card2 from '@nestwallet/app/assets/videos/home/tools/video-card-2.mp4';
import card3 from '@nestwallet/app/assets/videos/home/tools/video-card-3.mp4';
import card4 from '@nestwallet/app/assets/videos/home/tools/video-card-4.mp4';
import Image from 'next/image';
import { MouseEvent, useRef, useState } from 'react';
import { InfoPill } from '../common/info-pill';
import { VideoCard } from '../common/video-card';

export function Tools() {
  //Click-and-drag scroll logic. Only needed for small screens without touch screen or trackpad
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeft(scrollContainerRef.current!.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current!.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      className='flex w-full flex-col items-center justify-center py-8 pl-8'
      style={{ height: 1000 }}
    >
      <div className='flex h-full w-full max-w-[1800px] flex-col md:w-5/6'>
        <div className='pointer-events-none absolute flex lg:left-32'>
          <Image src={glow} height={600} alt={''} />
          <Image className='absolute' src={grid} height={600} alt={''} />
        </div>

        <div className='pointer-events-none absolute right-0 mt-32 flex md:mt-0'>
          <Image src={heroBg} height={800} alt={''} />
        </div>

        <div className='z-10 flex w-full flex-col space-y-6'>
          <InfoPill icon={faGamepad} text='Built By Degens, For Degens' />

          <div className='text-text-primary flex text-4xl font-medium lg:text-6xl'>
            More Professional Tools
          </div>

          <div className='text-text-primary/60 flex text-sm font-medium leading-8 lg:text-xl'>
            Engineered to suit your trading needs as an on-chain Degen
          </div>
        </div>
        <div
          className='hide-scrollbar mt-10 flex h-[65%] w-full flex-row items-center justify-start space-x-4 overflow-x-auto lg:space-x-6 2xl:overflow-visible'
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <VideoCard
            text='Trade Your Favorite Tokens'
            textColor={'Black'}
            backgroundColor={'#fdf43f'}
            video={card1}
          />
          <VideoCard
            text='Fully Self-Custodial with Max Security'
            textColor={'White'}
            backgroundColor={'#0230a4'}
            video={card2}
          />
          <VideoCard
            text='Mobile & Extension Synced'
            textColor={'Black'}
            backgroundColor={'#3fd5d4'}
            video={card3}
          />
          <VideoCard
            text='Earn Nest XP on Every Transaction'
            textColor={'White'}
            backgroundColor={'#259e6e'}
            video={card4}
          />
        </div>
      </div>
    </div>
  );
}
