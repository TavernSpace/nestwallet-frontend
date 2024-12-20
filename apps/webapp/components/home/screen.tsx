import { getAPIEndpoint } from '@nestwallet/app/common/api/nestwallet/utils';
import { empty } from '@nestwallet/app/common/utils/functions';
import { ShowSnackbarSeverity } from '@nestwallet/app/provider/snackbar';
import { SplashContextProvider } from '@nestwallet/app/provider/splash';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';
import { Footer } from '../layout/footer';
import { useWebSnackbar } from '../provider/snackbar';
import { About } from './about';
import { Feature0 } from './feature-0';
import { Feature1 } from './feature-1';
import { Header } from './header';
import { Hero } from './hero';
import { InvestorLogoCloud } from './investors';
import { Rewards } from './rewards';
import { Team } from './team';
import { Trading } from './trading';

export function HomeScreen() {
  const router = useRouter();
  const { showSnackbar } = useWebSnackbar();
  const { query } = router;

  const linkRef = useRef(false);

  const handleLinked = async (source: string | string[] | undefined) => {
    if (!linkRef.current && source && typeof source === 'string') {
      linkRef.current = true;
      fetch(`${getAPIEndpoint()}/nestwallet/analytics/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source,
        }),
      }).catch(empty);
      router.replace('');
    }
  };

  const handleReferral = async (referral: string | string[] | undefined) => {
    if (referral && typeof referral === 'string' && referral.length > 0) {
      showSnackbar({
        duration: 4000,
        message: 'Please wait while we redirect you...',
        severity: ShowSnackbarSeverity.success,
      });
      router.push({
        pathname: '/login',
        query: {
          referral,
        },
      });
    }
  };

  useEffect(() => {
    handleReferral(query.referral);
    handleLinked(query.source);
  }, [query]);

  return (
    <SplashContextProvider>
      <div className='bg-background flex flex-col items-center overflow-x-hidden'>
        <Header />
        <Hero />
        <InvestorLogoCloud />
        <Feature0 />
        <Feature1 />
        <Trading />
        <Rewards />
        <About />
        <Team />
        <Footer />
      </div>
    </SplashContextProvider>
  );
}
