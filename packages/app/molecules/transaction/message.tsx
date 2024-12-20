import { formatEVMAddress } from '../../common/format/evm';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { isEVMAddress } from '../../features/evm/utils';

// Utilities for parse EIP-712 messages

type Message = Record<string, any> | string | number;

const isAddress = (message: Message): message is string =>
  typeof message === 'string' && isEVMAddress(message);

const isObject = (message: Message): message is Record<string, any> =>
  typeof message === 'object';

const parseMessage = (message: Record<string, Message>) => (
  <View className='flex flex-col'>
    {Object.keys(message).map((key, index) => {
      const value = message[key]!;
      return (
        <View key={index} className='pl-2'>
          {!isObject(value) ? (
            <Text className='text-text-secondary text-xs font-light'>
              <Text className='text-text-primary text-xs font-normal'>
                {`${key}: `}
              </Text>
              {isAddress(value) ? `${formatEVMAddress(value)}` : value}{' '}
            </Text>
          ) : (
            <View className='flex flex-col'>
              <Text className='text-text-primary text-xs font-normal'>
                {`${key}: `}
              </Text>
              {parseMessage(value)}
            </View>
          )}
        </View>
      );
    })}
  </View>
);

export const TypedMessage = (props: { message: Record<string, any> }) => {
  const { message } = props;

  return <View className='-ml-2 flex flex-col'>{parseMessage(message)}</View>;
};
