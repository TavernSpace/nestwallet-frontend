import { ActionSheet } from '@nestwallet/app/components/sheet';
import { ActionSheetHeader } from '@nestwallet/app/components/sheet/header';
import { BrowserHistorySkeleton } from '@nestwallet/app/components/skeleton/list-item';
import { View } from '@nestwallet/app/components/view';
import { useSafeAreaInsets } from '@nestwallet/app/features/safe-area';
import { IBookmark } from '@nestwallet/app/graphql/client/generated/graphql';
import { FlatList } from 'react-native';
import { RecentsIcon } from './website-icons';

interface BookmarkSheetProps {
  bookmarks: IBookmark[];
  isShowing: boolean;
  onClose: VoidFunction;
  onPressBookmark: (url: string) => void;
  onDeleteBookmark: (id: string) => Promise<void>;
}

export function BookmarkSheet(props: BookmarkSheetProps) {
  const { bookmarks, isShowing, onClose, onPressBookmark, onDeleteBookmark } =
    props;
  const { bottom } = useSafeAreaInsets();

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasTopInset={true}
    >
      <ActionSheetHeader
        title='All Favorites'
        onClose={onClose}
        type='fullscreen'
      />
      <FlatList
        data={bookmarks}
        renderItem={({ item }) => (
          <RecentsIcon
            website={item}
            onPress={(url) => {
              onPressBookmark(url);
              onClose();
            }}
            onDelete={() => onDeleteBookmark(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className='flex flex-row space-x-4'>
            <BrowserHistorySkeleton fixed={true} />
            <BrowserHistorySkeleton fixed={true} />
          </View>
        }
        numColumns={2}
        contentContainerStyle={{ paddingBottom: bottom, paddingHorizontal: 16 }}
      />
    </ActionSheet>
  );
}
