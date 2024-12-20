import { useRouter } from 'next/router';
import { TonConnectScreen } from '../components/tonconnect';

export default function TonConnectPage() {
  const router = useRouter();
  const { query } = router;
  const queryParams = new URLSearchParams(
    query as Record<string, string>,
  ).toString();
  const reconstructedUrl = `https://nestwallet.xyz/tonconnect?${queryParams}`;

  return (
    <div className='bg-background h-full w-full overflow-hidden'>
      {queryParams && <TonConnectScreen url={reconstructedUrl} />}
    </div>
  );
}
