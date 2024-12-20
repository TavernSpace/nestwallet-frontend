import { styled } from 'nativewind';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { formatEVMAddress } from '../../../common/format/evm';
import { adjust } from '../../../common/utils/style';
import { ContactAvatar } from '../../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { WalletIcon } from '../../../components/wallet-icon';
import { colors } from '../../../design/constants';
import { SafeSignerInfo } from '../../../features/proposal/signer';
import { isHardwareWallet } from '../../../features/wallet/utils';

export function TransactionSignerItem(props: {
  signerInfo: SafeSignerInfo;
  onSignerPressed?: (text: string) => void;
}) {
  const { signerInfo, onSignerPressed } = props;

  return (
    <ListItem
      className='rounded-2xl'
      disabled={!onSignerPressed}
      onPress={
        onSignerPressed ? () => onSignerPressed(signerInfo.address) : undefined
      }
    >
      <View className='flex w-full flex-row items-center justify-between px-4 py-4'>
        <SignerDetail
          className='flex-1 pr-4'
          signerInfo={signerInfo}
          complete={true}
        />
        {signerInfo.hasSigned ? (
          <View className='flex flex-row items-center space-x-1 pr-2'>
            <View className='bg-success block h-2 w-2 rounded-full' />
            <Text className='text-success text-xs font-medium'>Signed</Text>
          </View>
        ) : (
          <View className='flex flex-row items-center space-x-1 pr-2'>
            <View className='bg-primary block h-2 w-2 rounded-full' />
            <Text className='text-primary text-xs font-medium'>Pending</Text>
          </View>
        )}
      </View>
    </ListItem>
  );
}

export const SignerDetail = styled(function (props: {
  signerInfo: SafeSignerInfo;
  displayType?: 'all' | 'others' | 'none';
  complete?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { signerInfo, displayType = 'all', complete = false, style } = props;
  const { name, address, signer, contact } = signerInfo;

  const size = adjust(36);
  const isHardware = signerInfo.signer
    ? isHardwareWallet(signerInfo.signer)
    : false;
  const showOtherDevice =
    !complete &&
    !!signerInfo.signer &&
    (!signerInfo.hasKeyring || (isHardware && Platform.OS !== 'web'));

  return (
    <View className='flex flex-row items-center space-x-4' style={style}>
      <View className='relative inline-block'>
        {signer ? (
          <WalletAvatar wallet={signer} size={size} borderColor={colors.card} />
        ) : contact ? (
          <ContactAvatar contact={contact} size={size} />
        ) : (
          <WalletIcon size={size} defaultStyle='primary' />
        )}
      </View>
      <View className='flex-1'>
        <Text
          className='text-text-primary overflow-hidden truncate text-sm font-medium'
          numberOfLines={1}
        >
          {name}
        </Text>
        <Text
          className='text-text-secondary overflow-hidden text-xs font-normal'
          numberOfLines={1}
        >
          {formatEVMAddress(address)}
        </Text>
      </View>
      {displayType !== 'none' && showOtherDevice && (
        <View className='bg-info/10 rounded-full px-2 py-1'>
          <Text className='text-info text-xs font-normal'>Other Device</Text>
        </View>
      )}
      {displayType === 'all' && signer && !showOtherDevice && (
        <View className='bg-primary/10 rounded-full px-2 py-1'>
          <Text className='text-primary text-xs font-medium'>You</Text>
        </View>
      )}
      {displayType !== 'none' && !signer && !showOtherDevice && (
        <View className='bg-card-highlight rounded-full px-2 py-1'>
          <Text className='text-text-secondary text-xs font-normal'>
            Not You
          </Text>
        </View>
      )}
    </View>
  );
});
