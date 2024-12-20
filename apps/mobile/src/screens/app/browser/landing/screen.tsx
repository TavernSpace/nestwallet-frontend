import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faEllipsisV } from '@fortawesome/pro-light-svg-icons';
import {
  faClock,
  faGlobe,
  faStar,
  faTrash,
} from '@fortawesome/pro-solid-svg-icons';
import {
  Loadable,
  Origin,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { opacity } from '@nestwallet/app/common/utils/functions';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { adjust } from '@nestwallet/app/common/utils/style';
import { ColoredIconButton } from '@nestwallet/app/components/button/icon-button';
import { FlatList } from '@nestwallet/app/components/flashlist/flat-list';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { LongDappItem } from '@nestwallet/app/components/long-dapp-item';
import { Skeleton } from '@nestwallet/app/components/skeleton';
import { BrowserHistorySkeleton } from '@nestwallet/app/components/skeleton/list-item';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_WIDTH, colors } from '@nestwallet/app/design/constants';
import { useSafeAreaInsets } from '@nestwallet/app/features/safe-area';
import { IBookmark } from '@nestwallet/app/graphql/client/generated/graphql';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { ConnectionType } from '@nestwallet/app/screens/approval/types';
import cn from 'classnames';
import { useState } from 'react';
import { BookmarkSheet } from './sheet';
import { RecentsIcon } from './website-icons';

interface BrowserLandingScreenProps {
  bookmarks: Loadable<IBookmark[]>;
  suggestedDapps: Loadable<Origin[]>;
  history: Loadable<Origin[]>;
  connectedSites: Loadable<
    { url: string; title: string; connectionType: ConnectionType }[]
  >;
  onPressLink: (url: string) => void;
  onPressClearHistory: VoidFunction;
  onDeleteHistoryItem: (url: string) => Promise<void>;
  onDeleteBookmark: (id: string) => Promise<void>;
  onDisconnectAll: VoidPromiseFunction;
}

export function BrowserLandingScreen(props: BrowserLandingScreenProps) {
  const {
    bookmarks,
    suggestedDapps,
    history,
    connectedSites,
    onPressLink,
    onPressClearHistory,
    onDeleteBookmark,
    onDeleteHistoryItem,
    onDisconnectAll,
  } = props;
  const { showSnackbar } = useSnackbar();
  const { bottom } = useSafeAreaInsets();

  const [showBookmarkSheet, setShowBookmarkSheet] = useState(false);

  const width = (SCREEN_WIDTH - 80) / 4;

  const handleDisconnectAll = async () => {
    try {
      await onDisconnectAll();
      showSnackbar({
        message: 'Successfully disconnected!',
        severity: ShowSnackbarSeverity.success,
      });
    } catch {
      showSnackbar({
        message: 'Failed to disconnect, please try again',
        severity: ShowSnackbarSeverity.error,
      });
    }
  };

  const Header = (
    <View className='bg-background mb-3 flex flex-col space-y-6'>
      <SiteList
        sites={bookmarks}
        estimatedItemSize={width}
        onPressItem={onPressLink}
        header={
          <ListHeader
            icon={faStar}
            text='Favorites'
            color={colors.questTime}
            buttonProps={{
              color: colors.questTime,
              buttonIcon: faEllipsisV,
              onPress: () => setShowBookmarkSheet(true),
            }}
          />
        }
      />
      <SiteList
        sites={history}
        estimatedItemSize={width}
        onPressItem={onPressLink}
        onDeleteItem={onDeleteHistoryItem}
        header={
          <ListHeader
            icon={faClock}
            text='Recent'
            color={colors.receive}
            buttonProps={{
              color: colors.failure,
              buttonIcon: faTrash,
              onPress: onPressClearHistory,
            }}
          />
        }
      />
      <ListHeader
        icon={faGlobe}
        text='Connected Sites'
        color={colors.info}
        buttonProps={
          connectedSites.data?.length! > 0
            ? {
                buttonIcon: faTrash,
                color: colors.failure,
                onPress: handleDisconnectAll,
              }
            : undefined
        }
      />
    </View>
  );

  const connectedSitesData = connectedSites.data ?? [];

  return (
    <View className='bg-background h-full w-full'>
      <View className='h-full flex-1 px-4'>
        <FlatList
          ListHeaderComponent={Header}
          data={connectedSitesData}
          renderItem={({ item, index }) => (
            <View
              className={cn('bg-card overflow-hidden', {
                'rounded-t-2xl pt-2': index === 0,
                'rounded-b-2xl pb-2': index === connectedSitesData.length - 1,
              })}
            >
              <LongDappItem
                website={item}
                showConnection={true}
                connectionType={item.connectionType}
                backgroundColor={colors.card}
                onPressItem={onPressLink}
                disabled={item.connectionType !== 'injection'}
              />
            </View>
          )}
          ListEmptyComponent={
            connectedSites.loading ? (
              <Skeleton width={'100%'} height={116} borderRadius={16} />
            ) : (
              <ConnectedSiteEmptySection />
            )
          }
          contentContainerStyle={{
            paddingBottom: bottom + 60,
          }}
          estimatedItemSize={40}
        />
      </View>
      <BookmarkSheet
        bookmarks={bookmarks.data ?? []}
        isShowing={showBookmarkSheet}
        onClose={() => setShowBookmarkSheet(false)}
        onDeleteBookmark={onDeleteBookmark}
        onPressBookmark={onPressLink}
      />
    </View>
  );
}

function ListHeader(props: {
  icon: IconProp;
  text: string;
  color: string;
  buttonProps?: {
    color: string;
    buttonIcon: IconProp;
    onPress: VoidFunction;
  };
}) {
  const { icon, color, text, buttonProps } = props;
  return (
    <View className='flex w-full flex-row items-center justify-between'>
      <View className='flex flex-row items-center space-x-2'>
        <View
          className='h-7 w-7 items-center justify-center rounded-full'
          style={{ backgroundColor: opacity(color, 10) }}
        >
          <FontAwesomeIcon icon={icon} color={color} size={adjust(16, 2)} />
        </View>
        <Text
          className='text-left text-sm font-medium'
          style={{ color: colors.textPrimary }}
        >
          {text}
        </Text>
      </View>
      {buttonProps && (
        <ColoredIconButton
          icon={buttonProps.buttonIcon}
          color={buttonProps.color}
          onPress={buttonProps.onPress}
        />
      )}
    </View>
  );
}

function SiteList(props: {
  sites: Loadable<Origin[]>;
  estimatedItemSize: number;
  onPressItem: (url: string) => void;
  onDeleteItem?: (url: string) => Promise<void>;
  header?: React.ReactNode;
}) {
  const { sites, estimatedItemSize, onPressItem, onDeleteItem, header } = props;

  return (
    <View className='mb-6 space-y-3'>
      {header}
      <View style={{ height: (SCREEN_WIDTH - 48) / 2 }}>
        {onLoadable(sites)(
          () => (
            <FlatList
              data={Array.from(Array(4).keys())}
              renderItem={() => <BrowserHistorySkeleton />}
              keyExtractor={(item, index) => `recent:loading:${index}`}
              horizontal={true}
              ItemSeparatorComponent={() => <View className='w-4' />}
              estimatedItemSize={estimatedItemSize}
            />
          ),
          () => (
            <FlatList
              data={Array.from(Array(4).keys())}
              renderItem={() => <BrowserHistorySkeleton fixed={true} />}
              keyExtractor={(item, index) => `recent:error:${index}`}
              estimatedItemSize={estimatedItemSize}
              horizontal={true}
              ItemSeparatorComponent={() => <View className='w-4' />}
            />
          ),
          (history) => {
            const validItems = history
              .filter((item) => !!item.url)
              .slice(0, 10);
            const allItems =
              validItems.length < 4
                ? (validItems as (Origin | number)[]).concat(
                    Array.from(Array(4 - history.length).keys()),
                  )
                : validItems;
            return (
              <FlatList
                data={allItems}
                renderItem={({ item }) =>
                  typeof item === 'number' ? (
                    <BrowserHistorySkeleton fixed={true} />
                  ) : (
                    <RecentsIcon
                      website={item}
                      onPress={onPressItem}
                      onDelete={onDeleteItem}
                    />
                  )
                }
                keyExtractor={(item, index) =>
                  `recent:${
                    typeof item === 'number' ? item : item.url!
                  }:${index}`
                }
                horizontal={true}
                ItemSeparatorComponent={() => <View className='w-4' />}
                estimatedItemSize={estimatedItemSize}
              />
            );
          },
        )}
      </View>
    </View>
  );
}

function ConnectedSiteEmptySection() {
  return (
    <View className='bg-card flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-4'>
      <View className='bg-primary/10 h-9 w-9 items-center justify-center rounded-full'>
        <FontAwesomeIcon icon={faGlobe} size={24} color={colors.primary} />
      </View>
      <View className='flex flex-col items-center justify-center space-y-1'>
        <Text className='text-text-primary text-sm font-medium'>
          {'No Connected Sites'}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {'Any dApps you are connected to will show up here.'}
        </Text>
      </View>
    </View>
  );
}
