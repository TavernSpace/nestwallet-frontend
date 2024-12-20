import { adjust } from '../../../../common/utils/style';
import { ChainAvatar } from '../../../../components/avatar/chain-avatar';
import { BaseButton } from '../../../../components/button/base-button';
import {
  FlatList,
  RenderItemProps,
} from '../../../../components/flashlist/flat-list';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { ViewWithInset } from '../../../../components/view/view-with-inset';
import { ChainInfo, safeSupportedChains } from '../../../../features/chain';
import { IUser } from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface CreateSafeSelectChainScreenProps {
  user: IUser;
  onSelectChain: (chain: number) => void;
}

export function CreateSafeSelectChainScreen(
  props: CreateSafeSelectChainScreenProps,
) {
  const { user, onSelectChain } = props;
  const { language } = useLanguageContext();

  const renderItem = ({
    item,
    extraData,
  }: RenderItemProps<ChainInfo, IUser>) => (
    <ChainItem
      chain={item}
      free={extraData!.safeDeployCredit > 0 && item.id !== 1}
      onPress={() => onSelectChain(item.id)}
    />
  );

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      <View className='h-full w-full justify-between space-y-4 px-4'>
        <View className='bg-card flex-1 rounded-xl'>
          <FlatList
            data={safeSupportedChains}
            extraData={user}
            estimatedItemSize={adjust(64)}
            renderItem={renderItem}
            keyExtractor={(item, index) => item.id.toString() + index}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}

function ChainItem(props: {
  chain: ChainInfo;
  free: boolean;
  onPress: VoidFunction;
}) {
  const { chain, free, onPress } = props;
  const { language } = useLanguageContext();

  return (
    <BaseButton className='w-full overflow-hidden rounded-lg' onPress={onPress}>
      <View className='flex w-full flex-row items-center space-x-4 rounded-lg px-4 py-3'>
        <ChainAvatar chainInfo={chain} size={adjust(36)} />
        <View className='flex flex-col'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-sm font-medium'>
              {chain.name}
            </Text>
            {free && (
              <View className='bg-success/10 rounded-md px-2 py-0.5'>
                <Text className='text-success text-sm font-medium'>
                  {localization.free[language]}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </BaseButton>
  );
}
