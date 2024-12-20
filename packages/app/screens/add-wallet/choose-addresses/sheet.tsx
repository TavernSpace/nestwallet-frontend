import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LedgerPathType } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import {
  FlatList,
  RenderItemProps,
} from '../../../components/flashlist/flat-list';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ListItem } from '../../../components/list/list-item';
import { ActionSheet } from '../../../components/sheet';
import { ActionSheetHeader } from '../../../components/sheet/header';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { useSafeAreaInsets } from '../../../features/safe-area';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface PathOption {
  name: LedgerPathType;
  pathDerivation: string;
}

interface PathSelectSheetProps {
  isShowing: boolean;
  onClose: VoidFunction;
  pathOptions: PathOption[];
  selectedPath: LedgerPathType;
  handleSelectPath: (key: LedgerPathType) => void;
}

export function PathSelectSheet(props: PathSelectSheetProps) {
  const { isShowing, onClose, pathOptions, selectedPath, handleSelectPath } =
    props;
  const { bottom } = useSafeAreaInsets();
  const { language } = useLanguageContext();

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<PathOption, LedgerPathType>) => (
    <ListItem onPress={() => handleSelectPath(item.name)}>
      <View
        className={cn('flex w-full flex-row items-center space-x-4 px-4 py-3', {
          'bg-card-highlight': item.name === extraData,
          'rounded-lg': item.name !== extraData,
        })}
      >
        <View className='flex w-full flex-row items-center justify-between'>
          <View className='mx-2 flex flex-col'>
            <Text className='text-text-primary text-base font-bold'>
              {item.name}
            </Text>
            <Text className='text-text-secondary text-sm font-normal'>
              {item.pathDerivation}
            </Text>
          </View>
          {item.name === extraData && (
            <View className='mx-2'>
              <FontAwesomeIcon color={colors.success} icon={faCheck} />
            </View>
          )}
        </View>
      </View>
    </ListItem>
  );

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title={localization.selectLedgerPath[language]}
        onClose={onClose}
        type='detached'
      />
      <FlatList
        data={pathOptions}
        extraData={selectedPath}
        estimatedItemSize={adjust(64)}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingBottom: bottom }}
      />
    </ActionSheet>
  );
}
