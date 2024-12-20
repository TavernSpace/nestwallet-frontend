import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider as PaperProvider } from 'react-native-paper';
import { SCREEN_HEIGHT, SCREEN_WIDTH } from '../../design/constants';
import { theme } from '../../design/paper/theme';
import { View } from '../view';

export function Frame(props: { children: React.ReactNode; isWeb?: boolean }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <View
          className='overflow-y-auto overflow-x-hidden bg-slate-50'
          style={{
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
          }}
        >
          {props.children}
        </View>
      </PaperProvider>
    </QueryClientProvider>
  );
}
