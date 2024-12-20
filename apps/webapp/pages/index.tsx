import { HomeScreen } from '../components/home/screen';
import { SnackbarContextProvider } from '../components/provider/snackbar';

export default function LandingPage() {
  return (
    <SnackbarContextProvider>
      <HomeScreen />
    </SnackbarContextProvider>
  );
}
