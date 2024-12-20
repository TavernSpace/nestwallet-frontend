import 'raf/polyfill';
import 'setimmediate';

import { AppProps } from 'next/app';
import localFont from 'next/font/local';
import Head from 'next/head';
import '../global.css';
import { Metadata } from '../screens/meta';

const aeonik = localFont({
  src: [
    {
      path: '../public/fonts/Aeonik-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Aeonik-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Aeonik-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
});

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className={`${aeonik.className} h-full w-full`}>
      <Head>
        <link
          rel='apple-touch-icon'
          sizes='180x180'
          href='https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/images/apple-touch-icon.png'
        />
        <link
          rel='shortcut_icon'
          href='https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/images/favicon.ico'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='32x32'
          href='https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/images/favicon-32x32.png'
        />
        <link
          rel='icon'
          type='image/png'
          sizes='16x16'
          href='https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/images/favicon-16x16.png'
        />
      </Head>
      <Metadata />
      <div className='h-full w-full font-normal'>
        <Component {...pageProps} />
      </div>
    </main>
  );
}

export default MyApp;
