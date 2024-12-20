import { faLock } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform } from 'react-native';
import EmptyRewards from '../../../../assets/images/empty-rewards.svg';
import { adjust, withSize } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { CardEmptyState } from '../../../../components/card/card-empty-state';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Image } from '../../../../components/image';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';

export function GasSection() {
  return (
    <View className='h-[70%] w-full justify-center'>
      <CardEmptyState
        icon={EmptyRewards}
        title='Coming Soon'
        description='Nest skills are coming soon. Stay tuned!'
      />
    </View>
  );
}

function GasCard(props: { isLocked: boolean }) {
  const { isLocked } = props;
  const size = adjust(36);
  const isMobile = Platform.OS !== 'web';

  return (
    <View className='py-2'>
      <View
        className={cn(
          'flex h-20 w-full flex-row items-center justify-center space-x-2',
          { 'h-24': isMobile },
        )}
      >
        <View className='flex h-full flex-row items-center space-x-4'>
          <View className='border-text-secondary h-full w-20 items-center justify-center rounded-bl-xl rounded-br-md rounded-tl-md rounded-tr-xl border'>
            <View className='border-text-button-primary rounded-full border-2 p-1'>
              <View className='overflow-hidden rounded-full'>
                <Image
                  source={{
                    uri: 'https://media.discordapp.net/attachments/1191841580965957735/1228385343489839216/image.png?ex=662bda00&is=66196500&hm=fc8b273df9805db8e8523a35062cc7f487a8cf64f8360f1d4598251a97d49a94&=&format=webp&quality=lossless',
                  }}
                  style={withSize(size)}
                  blurRadius={isLocked ? adjust(2, 2) : 0}
                />
              </View>
            </View>
            <Text className='text-text-primary text-xs font-medium'>
              Lv. 3/5
            </Text>
            {isLocked && (
              <View className='absolute right-2 top-0'>
                <FontAwesomeIcon
                  icon={faLock}
                  color={colors.textSecondary}
                  size={adjust(16, 2)}
                />
              </View>
            )}
          </View>
        </View>
        <View className='bg-card-highlight/80 px-2s h-full w-[75%] flex-row justify-between rounded-lg px-2 py-1'>
          <View className='flex w-44 flex-col space-y-2'>
            <Text className='text-text-primary text-sm font-bold'>
              Polygon gas discount
            </Text>
            <LinearGradient
              colors={[
                colors.background,
                colors.questBorder,
                colors.background,
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              locations={[0.01, 0.1, 1]}
              style={{
                height: 1,
                width: '100%',
              }}
            />
            <Text className='text-text-secondary text-xss font-bold'>
              Get 15% of gas back on any Polygon transaction (up to 10 txns
              daily)
            </Text>
          </View>
          {isLocked ? (
            <View className='flex-1 items-center justify-center'>
              <View className='flex flex-row items-center space-x-4'>
                <View className='bg-card-highlight-secondary rounded-full px-2 py-1'>
                  <Text className='text-text-secondary text-xs font-medium'>
                    {'Locked'}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View className='flex-1 items-center justify-center space-y-1'>
              <Text className='text-primary text-xss font-bold'>
                +5% discount
              </Text>
              <View className='flex flex-row items-center space-x-4'>
                <BaseButton onPress={() => {}}>
                  <LinearGradient
                    colors={[colors.primary, colors.questClaim]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      borderRadius: 9999,
                    }}
                  >
                    <View className='flex flex-col space-x-1 rounded-full px-2 py-1'>
                      <Text className='text-text-button-primary text-xs font-medium'>
                        {'Upgrade'}
                      </Text>
                    </View>
                  </LinearGradient>
                </BaseButton>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
