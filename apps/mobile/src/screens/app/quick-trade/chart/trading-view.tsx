import { faQuestion } from '@fortawesome/pro-solid-svg-icons';
import { TokenDetailSettings } from '@nestwallet/app/common/types';
import { empty, opacity } from '@nestwallet/app/common/utils/functions';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Skeleton } from '@nestwallet/app/components/skeleton';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { useDimensions } from '@nestwallet/app/features/dimensions';
import { useMarketStreamContext } from '@nestwallet/app/provider/market-stream';
import { ChartType } from '@nestwallet/app/screens/token-details/types';
import { useMemo, useRef, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

export function TradingViewChart(props: {
  initialChartType: ChartType;
  onSettingsChange: (settings: TokenDetailSettings) => Promise<void>;
}) {
  const { initialChartType, onSettingsChange } = props;
  const { stream } = useMarketStreamContext();
  const { width } = useDimensions();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const webRef = useRef<WebView>(null);

  const handleRequest = async (event: WebViewMessageEvent) => {
    if (!webRef.current) return;
    const { data } = event.nativeEvent;
    const payload = JSON.parse(data);
    const type = payload.type;
    const params = payload.data;
    const id = payload.id;
    if (type === 'new_ohlc') {
      webRef.current.postMessage(
        JSON.stringify({
          id,
          data: stream.newOhlc(params.resolution),
        }),
      );
    } else if (type === 'positive') {
      webRef.current.postMessage(
        JSON.stringify({
          id,
          data: stream.positive(params.resolution),
        }),
      );
    } else if (type === 'all_ohlc') {
      webRef.current.postMessage(
        JSON.stringify({
          id,
          data: stream.allOhlc(params.resolution),
        }),
      );
    } else if (type === 'populate_ohlc') {
      await stream
        .populateOhlc(params.resolution)
        .then((data) => {
          webRef.current!.postMessage(
            JSON.stringify({
              id,
              data,
            }),
          );
        })
        .catch((err) => {
          webRef.current!.postMessage(
            JSON.stringify({
              id,
              error: 'Unable to get data',
            }),
          );
        });
    } else if (type === 'modify_settings') {
      await onSettingsChange(params).catch(empty);
      webRef.current.postMessage(
        JSON.stringify({
          id,
          data: undefined,
        }),
      );
    } else {
      webRef.current!.postMessage(
        JSON.stringify({
          id,
          error: 'Invalid request',
        }),
      );
    }
  };

  const chartHeight = 248;
  const source = useMemo(() => {
    // Uncomment this to use the local webapp instead
    // const root = Platform.OS === 'android' ?  'http://10.0.2.2:3000' : 'http://localhost:3000';
    const root = 'https://nestwallet.xyz';
    const path = `/internal/chart?initialType=${initialChartType}&contained=true`;
    return { uri: `${root}${path}` };
  }, []);
  const preventZoomJS = useMemo(() => {
    const injected =
      "const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'); meta.setAttribute('name', 'viewport'); document.head.appendChild(meta);";
    return injected;
  }, []);

  return (
    <View
      className='bg-background mb-2 flex h-[248px] flex-col overflow-hidden'
      style={{ height: chartHeight, width }}
    >
      <WebView
        ref={webRef}
        source={source}
        originWhitelist={[
          'http://localhost:3000',
          'https://nestwallet.xyz',
          'https://nestwallet.app',
        ]}
        bounces={false}
        scalesPageToFit={false}
        allowsBackForwardNavigationGestures={false}
        automaticallyAdjustContentInsets={false}
        pullToRefreshEnabled={false}
        thirdPartyCookiesEnabled={false}
        setBuiltInZoomControls={false}
        setSupportMultipleWindows={false}
        onMessage={handleRequest}
        onLoadStart={() => {
          setLoading(true);
        }}
        onLoad={() => {
          setLoading(false);
        }}
        onError={() => {
          setError(true);
        }}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400) {
            setError(true);
          }
        }}
        injectedJavaScript={preventZoomJS}
        scrollEnabled={false}
        style={{ backgroundColor: opacity(colors.background, 0) }}
        renderLoading={() => <View className='bg-background' />}
      />
      {error ? (
        <View
          className='bg-background absolute left-0 top-0 px-4'
          style={{ height: chartHeight }}
        >
          <View
            className='bg-card items-center justify-center rounded-2xl'
            style={{ height: chartHeight - 16, width: width - 32 }}
          >
            <View className='bg-primary/10 h-12 w-12 items-center justify-center rounded-full'>
              <FontAwesomeIcon
                icon={faQuestion}
                size={32}
                color={colors.primary}
              />
            </View>
            <View className='flex flex-col'>
              <Text className='text-text-primary text-center text-sm font-medium'>
                {'Unable to Load Chart'}
              </Text>
              <Text className='text-text-secondary text-center text-xs font-normal'>
                {'Something went wrong trying to load chart.'}
              </Text>
            </View>
          </View>
        </View>
      ) : loading ? (
        <View
          className='bg-background absolute left-0 top-0 px-4'
          style={{ height: chartHeight }}
        >
          <Skeleton
            height={chartHeight - 16}
            width={width - 32}
            borderRadius={16}
          />
        </View>
      ) : null}
    </View>
  );
}
