import { faChevronRight } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../common/format/address';
import { RecipientAccount } from '../../common/types';
import { adjust } from '../../common/utils/style';
import { ContactAvatar } from '../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { ActionSheet } from '../../components/sheet';
import { ActionSheetHeader } from '../../components/sheet/header';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { WalletIcon } from '../../components/wallet-icon';
import { colors } from '../../design/constants';
import {
  IBlockchainType,
  IContact,
  IInteractedAddress,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { AddressSelect } from '../../molecules/select/address-select';

export const RecipientSection = styled(function (props: {
  recipient?: RecipientAccount;
  disabled?: boolean;
  onRecipientPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { recipient, disabled = false, onRecipientPress, style } = props;

  if (!recipient) {
    return (
      <View style={style}>
        <BaseButton
          className='overflow-hidden'
          onPress={onRecipientPress}
          disabled={disabled}
        >
          <View
            className='bg-card flex flex-row items-center justify-between rounded-xl px-4'
            style={{ height: adjust(52, 6) }}
          >
            <Text className='text-text-secondary text-base font-medium'>
              {'Select Recipient'}
            </Text>
            <FontAwesomeIcon
              icon={faChevronRight}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
          </View>
        </BaseButton>
      </View>
    );
  }

  const { wallet, contact, name, address } = recipient;
  const size = adjust(36);

  return (
    <View style={style}>
      <BaseButton onPress={onRecipientPress} disabled={disabled}>
        <View className='bg-card flex flex-row items-center justify-between space-x-2 rounded-xl px-4 py-2'>
          <View className='flex flex-1 flex-row items-center space-x-3'>
            {wallet ? (
              <WalletAvatar
                size={size}
                wallet={wallet}
                borderColor={colors.card}
              />
            ) : contact ? (
              <ContactAvatar size={size} contact={contact} />
            ) : (
              <WalletIcon size={size} defaultStyle='neutral' />
            )}
            <View className='flex flex-1 flex-col'>
              <View className='flex flex-row items-center space-x-1'>
                <Text
                  className='text-text-primary truncate text-sm font-medium'
                  numberOfLines={1}
                >
                  {wallet?.name || contact?.name || name || 'Unknown'}
                </Text>
                <View className='flex-none' />
              </View>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(address)}
              </Text>
            </View>
          </View>
          {!disabled && (
            <FontAwesomeIcon
              icon={faChevronRight}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
          )}
        </View>
      </BaseButton>
    </View>
  );
});

export function RecipientSheet(props: {
  isShowing: boolean;
  blockchain: IBlockchainType;
  chainId: number;
  wallets: IWallet[];
  contacts: IContact[];
  interactions: IInteractedAddress[];
  onClose: VoidFunction;
  onRecipientChange: (recipient: RecipientAccount) => void;
  onAddContact: (
    name: string,
    address: string,
    blockchain: IBlockchainType,
  ) => Promise<void>;
  onScanQRCode?: VoidFunction;
}) {
  const {
    isShowing,
    blockchain,
    chainId,
    wallets,
    contacts,
    interactions,
    onClose,
    onRecipientChange,
    onAddContact,
    onScanQRCode,
  } = props;

  return (
    <ActionSheet
      isShowing={isShowing}
      onClose={onClose}
      isFullHeight={true}
      hasBottomInset={false}
    >
      <ActionSheetHeader
        title='Select Recipient'
        onClose={onClose}
        type='fullscreen'
      />
      <AddressSelect
        blockchain={blockchain}
        chainId={chainId}
        wallets={wallets}
        contacts={contacts}
        interactions={interactions}
        onScanQRCode={onScanQRCode}
        onChange={(account) => {
          onRecipientChange(account);
          onClose();
        }}
        onAddContact={onAddContact}
      />
    </ActionSheet>
  );
}
