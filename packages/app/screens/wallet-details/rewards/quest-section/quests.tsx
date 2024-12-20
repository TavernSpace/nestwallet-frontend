import { FlatList } from '../../../../components/flashlist/flat-list';
import { QuestItem } from '../../../../components/quests/quest-item/quest-item';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { View } from '../../../../components/view';
import {
  IQuest,
  IQuestIdentifier,
} from '../../../../graphql/client/generated/graphql';

interface QuestsSheetProps {
  quests: IQuest[];
  title?: string;
  onClaim: (id: IQuestIdentifier) => Promise<void>;
  onAction: (id: IQuestIdentifier) => void;
  onClose: VoidFunction;
}

export function QuestsSheet(props: QuestsSheetProps) {
  const { quests, title, onClaim, onAction, onClose } = props;

  return (
    <View className='flex h-full w-full flex-col'>
      <ActionSheetHeader
        title={title ?? 'Quests'}
        onClose={onClose}
        type='fullscreen'
      />
      <FlatList
        data={quests}
        ItemSeparatorComponent={() => <View className='h-3 w-full' />}
        renderItem={(item) => {
          return (
            <QuestItem
              quest={item.item}
              onClaim={() => onClaim(item.item.id)}
              onAction={() => onAction(item.item.id)}
            />
          );
        }}
        estimatedItemSize={40}
        contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 12 }}
      />
    </View>
  );
}
