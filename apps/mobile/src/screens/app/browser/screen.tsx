import type {
  ConnectedSite,
  Loadable,
  Origin,
  SiteInfo,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_HEIGHT } from '@nestwallet/app/design/constants';
import { useSafeAreaInsets } from '@nestwallet/app/features/safe-area';
import {
  IBookmark,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { ConnectionType } from '@nestwallet/app/screens/approval/types';
import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import { useBrowserHistoryQuery } from '../../../hooks/browser';
import { useAppContext } from '../../../provider/application';
import { useUserContext } from '../../../provider/user';
import { BrowserLandingScreen } from './landing/screen';
import { TopNavBar } from './nav-bars';

interface BrowserScreenProps {
  wallet: IWallet;
  webViewRef: React.RefObject<WebView>;
  injectedJSContent: string;
  bookmarks: Loadable<IBookmark[]>;
  suggestedDapps: Loadable<Origin[]>;
  history: Loadable<Origin[]>;
  currentSite?: ConnectedSite;
  connectedSites: Loadable<
    { url: string; title: string; connectionType: ConnectionType }[]
  >;
  onCreateBookmark: (url: string, title?: string) => Promise<IBookmark>;
  onDeleteBookmark: (id: string) => Promise<void>;
  onMessage: (event: WebViewMessageEvent) => void;
  onSiteChange: (site?: SiteInfo) => Promise<void>;
  onDisconnectAll: VoidPromiseFunction;
  onWalletPress: VoidFunction;
}

export function BrowserScreen(props: BrowserScreenProps) {
  const {
    wallet,
    webViewRef,
    injectedJSContent,
    bookmarks,
    suggestedDapps,
    history,
    currentSite,
    connectedSites,
    onCreateBookmark,
    onDeleteBookmark,
    onMessage,
    onSiteChange,
    onDisconnectAll,
    onWalletPress,
  } = props;
  const { userService } = useAppContext();
  const { wallets } = useUserContext();
  const { top, bottom } = useSafeAreaInsets({ bottom: 8 });
  const { showSnackbar } = useSnackbar();

  const [bookmark, setBookmarked] = useState<IBookmark>();
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLandingPage, setShowLandingPage] = useState(false);

  const browserHistoryQuery = useBrowserHistoryQuery();

  const handleWebViewNavigationStateChange = async (
    navState: WebViewNavigation,
  ) => {
    const { url, loading, title, navigationType, canGoBack } = navState;
    if (loading || navigationType) return;
    setCanGoBack(canGoBack);
    setShowLandingPage(false);
    const curSite = currentSite;
    if (
      currentSite?.siteInfo?.url !== url ||
      currentSite.siteInfo.title !== title
    ) {
      const origin = new URL(url).origin;
      await onSiteChange({
        url,
        origin,
        title,
        imageUrl: getOriginIcon(origin),
      });
    }
    if (bookmarks.success) {
      setBookmarked(bookmarks.data.find((value) => value.url === url));
    }
    //Update history
    if (title !== '' && title !== curSite?.siteInfo?.title) {
      await userService.addBrowserHistory({ url, title });
      await browserHistoryQuery.refetch();
    }
  };

  const handleSubmitUrl = async (text: string) => {
    Keyboard.dismiss();
    webViewRef.current?.stopLoading();
    const parsedText = parseInputText(text);
    await onSiteChange({
      url: parsedText,
      origin: new URL(parsedText).origin,
      title: '',
      imageUrl: '',
    });
    webViewRef.current?.injectJavaScript(
      `window.location.href = '${parsedText}';`,
    );
  };

  const handleReset = async () => {
    await onSiteChange(undefined);
    setBookmarked(undefined);
    setCanGoBack(false);
    setShowLandingPage(false);
  };

  const handleClearHistory = async () => {
    await userService.clearBrowserHistory();
    await browserHistoryQuery.refetch();
  };

  const handleDeleteHistoryItem = async (url: string) => {
    await userService.deleteBrowserHistoryItem({ url });
    await browserHistoryQuery.refetch();
  };

  const handlePressBookmark = async () => {
    if (!currentSite || !currentSite.siteInfo) return;
    if (bookmark) {
      try {
        await onDeleteBookmark(bookmark.id);
        setBookmarked(undefined);
        showSnackbar({
          severity: ShowSnackbarSeverity.success,
          message: 'Favorite removed!',
        });
      } catch {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: 'Failed to remove favorite',
        });
      }
    } else {
      try {
        const bookmark = await onCreateBookmark(
          currentSite.siteInfo.url,
          currentSite.siteInfo.title,
        );
        setBookmarked(bookmark);
        showSnackbar({
          severity: ShowSnackbarSeverity.success,
          message: 'Favorite added!',
        });
      } catch {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: 'Failed to add favorite',
        });
      }
    }
  };

  const handleGoBack = () => {
    webViewRef.current?.stopLoading();
    webViewRef.current?.goBack();
  };

  const handleReload = () => {
    webViewRef.current?.stopLoading();
    webViewRef.current?.reload();
  };

  const parseInputText = (text: string) => {
    if (text.startsWith('www.')) {
      return `https://${text}`;
    }
    if (!text.includes('://')) {
      if (text.match(/^((?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,6}$/)) {
        return `https://${text}`;
      }
      return `https://www.google.com/search?q=${text.replace(/\s+/g, '+')}`;
    }
    return text;
  };

  const landingPageOpacity = useSharedValue(0);
  const landingPageTranslation = useSharedValue(500);

  const animatedLandingPageStyle = useAnimatedStyle(() => {
    return {
      opacity: landingPageOpacity.value,
      transform: [{ translateY: landingPageTranslation.value }],
    };
  });

  const handleShowLandingPageChange = () => {
    landingPageOpacity.value = withTiming(showLandingPage ? 1 : 0, {
      duration: 400,
    });
    landingPageTranslation.value = withTiming(
      showLandingPage ? 0 : SCREEN_HEIGHT,
      {
        duration: 400,
        easing: Easing.out(Easing.exp),
      },
    );
  };

  const hasSite = !!currentSite && !!currentSite.siteInfo;

  useEffect(() => {
    if (hasSite) {
      handleShowLandingPageChange();
    }
  }, [showLandingPage]);

  return (
    <View className='absolute h-full w-full'>
      <View
        className='h-full w-full'
        style={{
          paddingTop: top,
        }}
      >
        <TopNavBar
          wallet={wallet}
          wallets={wallets}
          loading={loading}
          canGoBack={canGoBack}
          currentSite={currentSite}
          showLandingPage={showLandingPage}
          isBookmarked={!!bookmark}
          onPressBack={handleGoBack}
          onPressReload={handleReload}
          onPressBookmark={handlePressBookmark}
          onFocus={() => {
            setShowLandingPage(true);
          }}
          onSubmit={handleSubmitUrl}
          onCloseLandingPage={() => setShowLandingPage(false)}
          onHome={handleReset}
          onWalletPress={onWalletPress}
        />
        <View className='relative flex flex-1 flex-col'>
          <View className='relative flex-grow'>
            {hasSite ? (
              <View
                className='absolute h-full w-full overflow-hidden'
                style={{
                  paddingBottom: Math.min(bottom, 24) + 60,
                }}
              >
                <WebView
                  ref={webViewRef}
                  source={{
                    uri: currentSite.siteInfo!.url,
                  }}
                  originWhitelist={['http://', 'https://', 'blob:', 'about:']}
                  allowsInlineMediaPlayback={true} // Without this, any video playback on a website would open in full screen automatically
                  allowsBackForwardNavigationGestures={true}
                  pullToRefreshEnabled={true}
                  javaScriptEnabled={true}
                  onMessage={onMessage}
                  onNavigationStateChange={handleWebViewNavigationStateChange}
                  injectedJavaScriptBeforeContentLoaded={injectedJSContent!}
                  setSupportMultipleWindows={false}
                  onLoadStart={() => setLoading(true)}
                  onLoad={() => {
                    setLoading(false);
                  }}
                />
              </View>
            ) : (
              <View
                style={{
                  paddingBottom: bottom,
                }}
              >
                <BrowserLandingScreen
                  bookmarks={bookmarks}
                  suggestedDapps={suggestedDapps}
                  history={history}
                  connectedSites={connectedSites}
                  onPressLink={handleSubmitUrl}
                  onPressClearHistory={handleClearHistory}
                  onDeleteBookmark={onDeleteBookmark}
                  onDeleteHistoryItem={handleDeleteHistoryItem}
                  onDisconnectAll={onDisconnectAll}
                />
              </View>
            )}
            <Animated.View
              className='absolute h-full w-full'
              style={animatedLandingPageStyle}
            >
              <BrowserLandingScreen
                bookmarks={bookmarks}
                suggestedDapps={suggestedDapps}
                history={history}
                connectedSites={connectedSites}
                onPressLink={handleSubmitUrl}
                onPressClearHistory={handleClearHistory}
                onDeleteBookmark={onDeleteBookmark}
                onDeleteHistoryItem={handleDeleteHistoryItem}
                onDisconnectAll={onDisconnectAll}
              />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}
