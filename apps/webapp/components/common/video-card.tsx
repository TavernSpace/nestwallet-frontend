import { delay } from '@nestwallet/app/common/api/utils';
import { useEffect, useRef, useState } from 'react';
import { adjustWeb, useIsInViewport, useScreenSize } from '../home/utils';

interface VideoCardProps {
  text: string;
  textColor: string;
  backgroundColor: string;
  video: string;
}

export function VideoCard(props: VideoCardProps) {
  const { text, textColor, backgroundColor, video } = props;
  const [scale, setScale] = useState(1);
  const [translateY, setTranslateY] = useState(0);
  const cardRef = useRef(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenSize = useScreenSize();
  const { isIntersecting, observer } = useIsInViewport(cardRef, 0.3);

  const handleIntersect = async () => {
    setScale(1.02);
    setTranslateY(-50);
    await delay(200);
    setTranslateY(0);
    setScale(1);
  };

  const handleMouseEnter = async () => {
    videoRef.current?.play();
    setTranslateY(-12);
    setScale(1.03);
    await delay(150);
    setTranslateY(0);
  };

  useEffect(() => {
    if (videoRef.current) {
      // On iOS, videos that are not playing are not loaded; they will be invisible until played. This ensures these videos are loaded no matter what. WHY?!?!??!?! You don't need this if videos autoplay!
      videoRef.current.load();
    }
  }, []);

  useEffect(() => {
    if (isIntersecting) {
      handleIntersect();
      observer!.disconnect();
    } else {
      setTranslateY(0);
      setScale(1);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [isIntersecting, observer]);

  return (
    <div
      className='z-10 flex flex-none flex-col items-center justify-between rounded-t-[50px] border border-black transition-all duration-300'
      style={{
        height: adjustWeb(540, screenSize, 0.9),
        width: adjustWeb(370, screenSize, 0.9),
        backgroundColor,
        transform: `translateY(${translateY}px) scale(${scale})`,
      }}
      ref={cardRef}
    >
      <div
        className='absolute inset-0 z-20'
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => {
          setScale(1);
          videoRef.current?.pause();
        }}
      />
      <div
        className='pointer-events-none flex px-6 py-8 text-3xl font-medium'
        style={{ color: textColor }}
      >
        {text}
      </div>

      <video
        className='pointer-events-none overflow-hidden rounded-t-3xl border border-black'
        style={{
          backgroundColor,
        }}
        src={video}
        ref={videoRef}
        loop={true}
        playsInline={true}
        muted={true}
      />
    </div>
  );
}
