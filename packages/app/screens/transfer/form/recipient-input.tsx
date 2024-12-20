import { faTimes } from '@fortawesome/pro-regular-svg-icons';
import * as Clipboard from 'expo-clipboard';
import _ from 'lodash';
import { styled } from 'nativewind';
import { Platform, StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { RecipientAccount } from '../../../common/types';
import { adjust } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { RawTextInput } from '../../../components/text-input';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { AccountListItem } from '../../../molecules/select/address-select/account-list-item';

export const RecipientInput = styled(function (props: {
  inputProps?: Partial<TextInputProps>;
  style?: StyleProp<ViewStyle>;
}) {
  const { inputProps, style } = props;

  const handleClear = () => {
    inputProps?.onChangeText?.('');
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    inputProps?.onChangeText?.(text);
  };

  return (
    <View style={style}>
      <View className='bg-card flex flex-row items-center space-x-2 rounded-xl py-2 pl-4 pr-2'>
        <Text className='text-text-secondary text-sm font-medium'>To</Text>
        <RawTextInput
          className='text-text-primary block flex-1 bg-transparent text-sm font-normal outline-none'
          placeholderTextColor={colors.textPlaceholder}
          style={{
            minHeight: 32,
            paddingBottom: Platform.OS === 'ios' ? 2 : undefined,
          }}
          placeholder='ENS or Address'
          {...inputProps}
        />
        {!_.isEmpty(props.inputProps?.value) ? (
          <BaseButton onPress={handleClear}>
            <View className='flex h-4 w-4 items-center justify-center pr-2'>
              <FontAwesomeIcon
                icon={faTimes}
                size={adjust(20, 2)}
                color={colors.textPrimary}
              />
            </View>
          </BaseButton>
        ) : (
          Platform.OS !== 'web' && (
            <BaseButton className='overflow-hidden' onPress={handlePaste}>
              <View className='bg-card-highlight items-center justify-center rounded-full px-3 py-1'>
                <Text className='text-text-primary text-right text-sm font-medium'>
                  Paste
                </Text>
              </View>
            </BaseButton>
          )
        )}
      </View>
    </View>
  );
});

export const RecipientView = styled(function (props: {
  recipient: RecipientAccount;
  chainId: number;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { recipient, chainId, onPress, style } = props;

  return (
    <View className='bg-card overflow-hidden rounded-2xl' style={style}>
      <AccountListItem
        name={recipient.name}
        chainId={chainId}
        address={recipient.address}
        wallet={recipient.wallet}
        contact={recipient.contact}
        interactionCount={recipient.interactions ?? 0}
        onPress={onPress}
      />
    </View>
  );
});
