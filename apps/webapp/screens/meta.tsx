import Head from 'next/head';

export function Metadata() {
  const title = 'Nest Wallet';
  const description = 'A Wallet Built for Traders';
  const preview =
    'https://storage.googleapis.com/nestwallet-public-resource-bucket/webapp/images/preview.png';

  return (
    <Head>
      <meta charSet='utf-8' />
      <title>{title}</title>
      <meta property='og:title' content={title} key='title' />
      <meta property='og:description' content={description} key='description' />
      <meta name='description' content={description} />
      <meta name='image' content={preview} />
      <meta name='image:src' content={preview} />
      <meta property='og:image' content={preview} />
      <meta property='og:image:src' content={preview} />
      <meta property='og:site_name' content={title} />
      <meta property='og:url' content='https://nestwallet.app' />
      <meta property='og:type' content='page' />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image:src' content={preview} />
      <meta name='twitter:card' content='summary_large_image' />
    </Head>
  );
}
