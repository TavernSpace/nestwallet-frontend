import { NestWalletClientEvents } from '@nestwallet/app/common/api/nestwallet/types';
import { IRPCRequest } from '@nestwallet/app/common/constants';
import {
  useMutationEmitter,
  useQueryRefetcher,
} from '@nestwallet/app/common/hooks/query';
import { Origin, SiteInfo } from '@nestwallet/app/common/types';
import { decodeMessage } from '@nestwallet/app/common/utils/encode';
import {
  composeLoadables,
  loadDataFromQuery,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  IBookmark,
  IWallet,
  useBookmarksQuery,
  useCreateBrowserBookmarkMutation,
  useDeleteBrowserBookmarkMutation,
  useSuggestedDappsQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { ConnectionType } from '@nestwallet/app/screens/approval/types';
import { useNavigation } from '@react-navigation/native';
import { useAssets } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  useBrowserHistoryQuery,
  useConnectedSiteQuery,
  useConnectedSitesQuery,
  useTonConnectConnectionsQuery,
  useWalletConnectConnectionsQuery,
} from '../../../hooks/browser';
import { useAppContext } from '../../../provider/application';
import {
  tonConnectProvider,
  walletConnectProvider,
} from '../../../provider/constants';
import { BrowserScreen } from './screen';

export function WalletBrowser(props: { wallet: IWallet }) {
  const { wallet } = props;
  const { ethereumService, solanaService, tonService, connectionService } =
    useAppContext();
  const { eventEmitter } = useNestWallet();
  const { showSnackbar } = useSnackbar();
  const navigation = useNavigation();

  const [injectedJSContent, setInjectedJSContent] = useState<string>();
  const [assets] = useAssets([
    require('../../../../assets/scripts/injected.script'),
  ]);

  const webViewRef = useRef<WebView>(null);

  const createBookmarkMutation = useMutationEmitter(
    graphqlType.Bookmark,
    useCreateBrowserBookmarkMutation(),
  );

  const removeBookmarkMutation = useMutationEmitter(
    graphqlType.Bookmark,
    useDeleteBrowserBookmarkMutation(),
  );

  const bookmarksQuery = useQueryRefetcher(
    graphqlType.Bookmark,
    useBookmarksQuery(),
  );
  const browserBookmarks = loadDataFromQuery(
    bookmarksQuery,
    (data) => data.bookmarks as IBookmark[],
  );

  const suggestedDappsQuery = useSuggestedDappsQuery();
  const suggestedDapps = loadDataFromQuery(
    suggestedDappsQuery,
    // TODO: re-enable after review goes through iOS
    (data) => [] as Origin[],
  );

  const browserHistoryQuery = useBrowserHistoryQuery();
  const browserHistory = loadDataFromQuery(browserHistoryQuery);

  const connectedSiteQuery = useConnectedSiteQuery();
  const connectedSite = loadDataFromQuery(connectedSiteQuery);

  const connectedSitesQuery = useConnectedSitesQuery();
  const connectedSites = loadDataFromQuery(connectedSitesQuery, (data) =>
    Object.entries(data).map(([url, connectionData]) => ({
      url,
      title: connectionData.title ?? new URL(url).hostname,
      connectionType: 'injection' as ConnectionType,
    })),
  );

  const walletConnectConnectionsQuery = useWalletConnectConnectionsQuery();
  const walletConnectConnections = loadDataFromQuery(
    walletConnectConnectionsQuery,
    (data) =>
      Object.entries(data).map(([url, connectionData]) => ({
        url,
        title: connectionData.title,
        connectionType: 'wc' as ConnectionType,
      })),
  );

  const tonConnectConnectionsQuery = useTonConnectConnectionsQuery();
  const tonConnectConnections = loadDataFromQuery(
    tonConnectConnectionsQuery,
    (data) =>
      Object.entries(data).map(([url, connectionData]) => ({
        url,
        title: connectionData.title,
        connectionType: 'tc' as ConnectionType,
      })),
  );

  const allConnections = composeLoadables(
    connectedSites,
    walletConnectConnections,
    tonConnectConnections,
  )((connectedSitesData, walletConnectData, tonConnectData) =>
    connectedSitesData.concat(walletConnectData).concat(tonConnectData),
  );

  // need to initialize and uninitialize services
  useEffect(() => {
    const handleConnectionReset = () => {
      connectedSiteQuery.refetch();
      connectedSitesQuery.refetch();
    };
    ethereumService.setWebView(webViewRef);
    solanaService.setWebView(webViewRef);
    tonService.setWebView(webViewRef);
    eventEmitter.on(
      NestWalletClientEvents.ConnectedSiteChanged,
      handleConnectionReset,
    );
    return () => {
      ethereumService.setWebView(null);
      solanaService.setWebView(null);
      tonService.setWebView(null);
      eventEmitter.removeListener(
        NestWalletClientEvents.ConnectedSiteChanged,
        handleConnectionReset,
      );
    };
  }, []);

  useEffect(() => {
    const getInjectedJSContent = async (uri: string) => {
      const injectedJSContent = await FileSystem.readAsStringAsync(uri);
      setInjectedJSContent(injectedJSContent);
    };
    if (assets && assets[0] && assets[0].localUri) {
      getInjectedJSContent(assets[0].localUri);
    }
  }, [assets]);

  const handleCreateBookmark = async (url: string, title?: string) => {
    const result = await createBookmarkMutation.mutateAsync({
      input: {
        title: title && title.length > 0 ? title : 'Bookmark',
        url,
      },
    });
    return result.createBrowserBookmark as IBookmark;
  };

  const handleDeleteBookmark = async (id: string) => {
    await removeBookmarkMutation.mutateAsync({
      input: { id },
    });
  };

  const handleMessage = async (event: WebViewMessageEvent) => {
    const { data, title, url } = event.nativeEvent;
    const request = decodeMessage<IRPCRequest>(data);
    if (!request) return;
    try {
      //TODO(Amir): maybe doing .startsWith is a bad idea :/
      if (request.type.startsWith('channel-ethereum')) {
        await ethereumService.handleRequest({
          sender: { title, url },
          request: request.detail,
        });
      } else if (request.type.startsWith('channel-solana')) {
        await solanaService.handleRequest({
          sender: { title, url },
          request: request.detail,
        });
      } else if (request.type.startsWith('channel-ton')) {
        await tonService.handleRequest({
          sender: { title, url },
          request: request.detail,
        });
      }
    } catch (err) {
      if (err instanceof Error) {
        showSnackbar({
          message: err.message,
          severity: ShowSnackbarSeverity.error,
        });
      }
    }
  };

  const handleSiteChange = async (siteInfo?: SiteInfo) => {
    await connectionService.setCurrentSite(siteInfo);
    await connectedSiteQuery.refetch();
  };

  const handleDisconnectAll = async () => {
    await Promise.all([
      connectionService.removeConnectedSites(),
      walletConnectProvider.disconnectAll(),
      tonConnectProvider.disconnectAll(),
    ]);
    await Promise.all([
      connectedSitesQuery.refetch(),
      walletConnectConnectionsQuery.refetch(),
      tonConnectConnectionsQuery.refetch(),
    ]);
  };

  const handleSelectWallet = () => {
    navigation.navigate('app', {
      screen: 'walletSelector',
    });
  };

  return onLoadable(connectedSite)(
    () => null,
    () => null,
    (connectedSite) =>
      injectedJSContent ? (
        <BrowserScreen
          wallet={wallet}
          webViewRef={webViewRef}
          injectedJSContent={injectedJSContent}
          bookmarks={browserBookmarks}
          suggestedDapps={suggestedDapps}
          history={browserHistory}
          currentSite={connectedSite ?? undefined}
          connectedSites={allConnections}
          onCreateBookmark={handleCreateBookmark}
          onDeleteBookmark={handleDeleteBookmark}
          onMessage={handleMessage}
          onSiteChange={handleSiteChange}
          onDisconnectAll={handleDisconnectAll}
          onWalletPress={handleSelectWallet}
        />
      ) : null,
  );
}
