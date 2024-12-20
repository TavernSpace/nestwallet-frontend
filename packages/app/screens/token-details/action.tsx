import { faPaperPlane } from '@fortawesome/pro-solid-svg-icons';
import { memo } from 'react';
import { opacity } from '../../common/utils/functions';
import { withSize } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { Button, BUTTON_HEIGHT } from '../../components/button/button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useSafeAreaInsets } from '../../features/safe-area';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';

export const ActionSection = memo(
  function (props: {
    token: ICryptoBalance;
    swapDisabled: boolean;
    sendableCount: number;
    onSwapPress: (token: ICryptoBalance, buy: boolean) => void;
    onSendPress: (token: ICryptoBalance) => void;
  }) {
    const { token, swapDisabled, sendableCount, onSendPress, onSwapPress } =
      props;
    const { bottom } = useSafeAreaInsets();

    const handleSendPress = () => {
      onSendPress(token);
    };

    const handleSwapPress = (buy: boolean) => {
      onSwapPress(token, buy);
    };

    return (
      <>
        <View
          className='mt-2 flex w-full flex-row items-center justify-center space-x-2 px-4'
          style={{ paddingBottom: bottom }}
        >
          {!swapDisabled && (
            <View className='flex flex-1 flex-row items-center space-x-2'>
              <Button
                className='flex-1'
                type='primary'
                onPress={() => handleSwapPress(true)}
                buttonColor={opacity(colors.success, 20)}
              >
                <View className='flex flex-row items-center space-x-2'>
                  <Text className='text-success text-sm font-bold'>
                    {'Buy'}
                  </Text>
                </View>
              </Button>
              <Button
                className='flex-1'
                type='primary'
                onPress={() => handleSwapPress(false)}
                buttonColor={opacity(colors.failure, 20)}
              >
                <View className='flex flex-row items-center space-x-2'>
                  <Text className='text-failure text-sm font-bold'>
                    {'Sell'}
                  </Text>
                </View>
              </Button>
            </View>
          )}
          {sendableCount > 0 && swapDisabled && (
            <View className='flex-1'>
              <Button
                type='primary'
                onPress={handleSendPress}
                buttonColor={opacity(colors.send, 20)}
              >
                <View className='flex flex-row items-center space-x-2'>
                  <FontAwesomeIcon color={colors.send} icon={faPaperPlane} />
                  <Text className='text-send text-sm font-bold'>{'Send'}</Text>
                </View>
              </Button>
            </View>
          )}
          {sendableCount > 0 && !swapDisabled && (
            <BaseButton onPress={handleSendPress}>
              <View
                className='items-center justify-center rounded-full'
                style={{
                  ...withSize(BUTTON_HEIGHT),
                  backgroundColor: opacity(colors.send, 15),
                }}
              >
                <FontAwesomeIcon color={colors.send} icon={faPaperPlane} />
              </View>
            </BaseButton>
          )}
        </View>
      </>
    );
  },
  (prev, cur) =>
    prev.token === cur.token &&
    prev.swapDisabled == cur.swapDisabled &&
    prev.sendableCount == cur.sendableCount,
);
