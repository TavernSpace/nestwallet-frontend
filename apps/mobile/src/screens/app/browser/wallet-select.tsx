import { faChevronDown } from '@fortawesome/pro-solid-svg-icons';
import { WalletAvatar } from '@nestwallet/app/components/avatar/wallet-avatar';
import { BaseButton } from '@nestwallet/app/components/button/base-button';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { Text } from '@nestwallet/app/components/text';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { IWallet } from '@nestwallet/app/graphql/client/generated/graphql';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';

export const WalletSelectItem = styled(function (props: {
  wallet?: IWallet | null;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { wallet, onPress, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <BaseButton onPress={onPress}>
          {wallet ? (
            <View className='flex flex-row items-center space-x-2 px-2 py-1'>
              <WalletAvatar wallet={wallet} size={32} />
            </View>
          ) : (
            <View className='flex flex-row items-center space-x-2 px-2 py-1'>
              <Text className='text-text-primary text-xs font-medium'>
                {'Select A Wallet'}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={12}
                color={colors.textPrimary}
              />
            </View>
          )}
        </BaseButton>
      </View>
    </View>
  );
});
