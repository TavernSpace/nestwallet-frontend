import {
  faGlobe,
  faTrash,
  faTriangleExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import {
  Loadable,
  Origin,
  VoidPromiseFunction,
} from '@nestwallet/app/common/types';
import { tuple } from '@nestwallet/app/common/utils/functions';
import { getOriginIcon } from '@nestwallet/app/common/utils/origin';
import {
  composeLoadables,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import { withSize } from '@nestwallet/app/common/utils/style';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { ColoredIconButton } from '@nestwallet/app/components/button/icon-button';
import { FlatList } from '@nestwallet/app/components/flashlist/flat-list';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Image } from '@nestwallet/app/components/image';
import { LongDappItem } from '@nestwallet/app/components/long-dapp-item';
import { ScrollView } from '@nestwallet/app/components/scroll';
import { Skeleton } from '@nestwallet/app/components/skeleton';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { ViewWithInset } from '@nestwallet/app/components/view/view-with-inset';
import { colors } from '@nestwallet/app/design/constants';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { Linking } from 'react-native';

interface ExploreScreenProps {
  tradingDapps: Loadable<Origin[]>;
  defiDapps: Loadable<Origin[]>;
  nftDapps: Loadable<Origin[]>;
  connectedSites: Loadable<Origin[]>;
  onDisconnect: (origin: string) => Promise<void>;
  onDisconnectAll: VoidPromiseFunction;
}

export function ExploreScreen(props: ExploreScreenProps) {
  const {
    tradingDapps,
    defiDapps,
    nftDapps,
    connectedSites,
    onDisconnect,
    onDisconnectAll,
  } = props;
  const { showSnackbar } = useSnackbar();

  const handleDisconnect = async (origin: string) => {
    try {
      await onDisconnect(origin);
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

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={false}>
      <View className='bg-card border-b-card-highlight flex-1 border-b'>
        <View className='mt-4 flex flex-row items-center justify-center'>
          <Text className='text-text-primary text-base font-medium'>
            {'Explore'}
          </Text>
        </View>
        <ScrollView className='mt-4 h-full w-full pb-4'>
          {onLoadable(
            composeLoadables(tradingDapps, defiDapps, nftDapps)(tuple),
          )(
            () => (
              <View className='flex flex-col space-y-4 px-4 pb-4'>
                <Skeleton width={'100%'} height={156} borderRadius={24} />
                <Skeleton width={'100%'} height={156} borderRadius={24} />
                <Skeleton width={'100%'} height={156} borderRadius={24} />
              </View>
            ),
            () => (
              <ExploreErrorSection />
            ),
            ([tradingDapps, defiDapps, nftDapps]) => {
              return (
                <View className='grid w-full flex-1 grid-cols-4 gap-4 px-4'>
                  {tradingDapps
                    .concat(defiDapps)
                    .concat(nftDapps)
                    .map((item, index) => (
                      <SquareDappItem
                        key={item.url ?? index}
                        website={item}
                        size={48}
                      />
                    ))}
                </View>
              );
            },
          )}
        </ScrollView>
      </View>
      <View className='bg-card border-card-highlight mt-4 max-h-[50%] space-y-4 border-t'>
        <View className='mt-4 flex flex-row items-center justify-between px-4'>
          <View className='h-7 w-7' />
          <Text className='text-text-primary text-base font-medium'>
            {'Connected Sites'}
          </Text>
          {connectedSites.success && connectedSites.data.length > 0 ? (
            <ColoredIconButton
              icon={faTrash}
              color={colors.failure}
              onPress={handleDisconnectAll}
            />
          ) : (
            <View className='h-7 w-7' />
          )}
        </View>
        {onLoadable(connectedSites)(
          () => (
            <View className='mx-4 pb-20'>
              <Skeleton width={'100%'} height={116} borderRadius={24} />
            </View>
          ),
          () => (
            <View className='pb-20'>
              <ConnectedSiteEmptySection />
            </View>
          ),
          (connectedSites) =>
            connectedSites.length > 0 ? (
              <FlatList
                data={connectedSites}
                renderItem={({ item }) => (
                  <LongDappItem
                    website={item}
                    showConnection={true}
                    onPressItem={() => Linking.openURL(url.toString())}
                    onPressDelete={() => handleDisconnect(item.url!)}
                  />
                )}
                estimatedItemSize={40}
                contentContainerStyle={{ paddingBottom: 80 }}
              />
            ) : (
              <View className='pb-20'>
                <ConnectedSiteEmptySection />
              </View>
            ),
        )}
      </View>
    </ViewWithInset>
  );
}

export function SquareDappItem(props: { website: Origin; size: number }) {
  const { website, size } = props;

  const url = new URL(website.url!);
  const icon = getOriginIcon(url.origin);

  return (
    <View className='flex flex-col items-center justify-center space-y-1'>
      <BaseButton onPress={() => Linking.openURL(url.toString())}>
        <View className='flex flex-col items-center space-y-1'>
          <View
            className='bg-card-highlight-secondary items-center justify-center rounded-xl'
            style={withSize(size)}
          >
            <Image
              source={{ uri: icon }}
              style={{
                ...withSize((size * 2) / 3),
                borderRadius: 8,
              }}
            />
          </View>
        </View>
      </BaseButton>
      <Text
        className='text-text-primary truncate text-center text-xs font-medium'
        numberOfLines={1}
      >
        {website.title}
      </Text>
    </View>
  );
}

function ConnectedSiteEmptySection() {
  return (
    <View className='bg-card-highlight mx-4 flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-4'>
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

function ExploreErrorSection() {
  return (
    <View className='bg-card-highlight mx-4 flex flex-col items-center justify-center space-y-2 rounded-2xl px-4 py-4'>
      <View className='bg-failure/10 h-9 w-9 items-center justify-center rounded-full'>
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          size={20}
          color={colors.failure}
        />
      </View>
      <View className='flex flex-col items-center justify-center space-y-1'>
        <Text className='text-text-primary text-sm font-medium'>
          {'Unable to get Sites'}
        </Text>
        <Text className='text-text-secondary text-center text-xs font-normal'>
          {'Something went wrong trying to get suggested sites.'}
        </Text>
      </View>
    </View>
  );
}
