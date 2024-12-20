import { MutableRefObject, useEffect, useMemo, useState } from 'react';

export const appStoreUrl =
  'https://apps.apple.com/us/app/nest-wallet/id6451122334';
export const googlePlayStoreUrl =
  'https://play.google.com/store/apps/details?id=xyz.nestwallet.nestwallet';
export const chromeWebStoreUrl =
  'https://chrome.google.com/webstore/detail/nest-wallet-extension-for/cmoakldedjfnjofgbbfenefcagmedlga?hl=en&authuser=0';

export const isSafari = (): boolean => {
  if (typeof window !== 'undefined') {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
  }
  return false;
};

export function useIsInViewport(
  ref: MutableRefObject<any>,
  thresholdValue = 0,
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  const observer = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return null;
    }

    return new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry!.isIntersecting);
      },
      { threshold: thresholdValue },
    );
  }, [thresholdValue]);

  useEffect(() => {
    if (ref.current) {
      observer!.observe(ref.current);
    }
    return () => observer!.disconnect();
  }, [ref, observer]);

  return { isIntersecting, observer };
}

export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState<{
    width?: number;
    height?: number;
  }>({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return screenSize;
};

export function adjustWeb(
  value: number,
  screenSize: { width?: number | undefined; height?: number | undefined },
  smMultipler?: number,
  mdMultiplier?: number,
  lgMultiplier?: number,
) {
  if (screenSize.width && screenSize.width <= 640) {
    //Small screen sizes(mobile)
    return smMultipler ? value * smMultipler : value;
  } else if (screenSize.width && screenSize.width <= 768) {
    //Medium screen sizes
    return mdMultiplier ? value * mdMultiplier : value;
  } else if (screenSize.width && screenSize.width <= 1024) {
    return lgMultiplier ? value * lgMultiplier : value;
  } else return value;
}
