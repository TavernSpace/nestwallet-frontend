import { faClone, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { faAnglesDown } from '@fortawesome/pro-solid-svg-icons';
import { formatAddress } from '../../../common/format/address';
import { formatCryptoFloat, formatMoney } from '../../../common/format/number';
import { NumberType } from '../../../common/format/types';
import { AssetTransfer, ISignerWallet } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { isCryptoBalance } from '../../../common/utils/types';
import { ContactAvatar } from '../../../components/avatar/contact-avatar';
import { CryptoAvatar } from '../../../components/avatar/crypto-avatar';
import { NFTAvatar } from '../../../components/avatar/nft-avatar';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { IconButton } from '../../../components/button/icon-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { WalletIcon } from '../../../components/wallet-icon';
import { colors } from '../../../design/constants';
import {
  IContact,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';

export function TransferReviewItem(props: {
  transfer: AssetTransfer;
  wallets: IWallet[];
  contacts: IContact[];
  signers: ISignerWallet[];
  comment?: string;
  copy: (text: string) => void;
  onDeleteTransfer?: (transfer: AssetTransfer) => void;
}) {
  const { transfer, wallets, contacts, signers, copy, onDeleteTransfer } =
    props;

  // TODO: This is pretty inefficient
  const contact = contacts.find(
    (contact) => transfer.recipient === contact.address,
  );
  const wallet = wallets
    .filter((wallet) => wallet.type === IWalletType.Safe)
    .concat(signers)
    .find(
      (wallet) =>
        transfer.recipient === wallet.address &&
        (wallet.chainId === transfer.asset.chainId || wallet.chainId === 0),
    );
  const name = wallet?.name || contact?.name || '';
  const size = adjust(24);

  return (
    <View className='bg-card mb-2 flex flex-col space-y-1 rounded-2xl px-4 py-4'>
      {onDeleteTransfer && (
        <View className='absolute right-2 top-2 z-50'>
          <IconButton
            icon={faTimes}
            size={adjust(16)}
            color={colors.textPrimary}
            onPress={() => onDeleteTransfer(transfer)}
          />
        </View>
      )}
      {isCryptoBalance(transfer.asset) ? (
        <View className='flex w-full flex-row justify-between'>
          <View className='flex flex-row items-center space-x-4'>
            <CryptoAvatar
              url={transfer.asset.tokenMetadata.imageUrl}
              symbol={transfer.asset.tokenMetadata.symbol}
              size={size}
            />
            <View className='flex flex-col'>
              <Text className='text-text-primary overflow-hidden truncate text-xs font-medium'>
                {transfer.asset.tokenMetadata.name}
              </Text>
              <Text className='text-text-secondary overflow-hidden truncate text-xs font-normal'>
                {transfer.asset.tokenMetadata.symbol}
              </Text>
            </View>
          </View>
          <View
            className='flex flex-col'
            style={{
              paddingRight: onDeleteTransfer ? adjust(16) : 0,
            }}
          >
            <Text className='text-failure overflow-hidden truncate pr-1 text-right text-xs font-medium'>
              {`-${formatCryptoFloat(
                parseFloat(transfer.value),
                NumberType.TokenTx,
              )}`}
            </Text>
            <Text className='text-text-secondary overflow-hidden truncate pr-1 text-right text-xs font-normal'>
              {formatMoney(parseFloat(transfer.fiatValue || '0'))}
            </Text>
          </View>
        </View>
      ) : (
        <View className='flex w-full flex-row justify-between'>
          <View className='flex flex-1 flex-row items-center space-x-4'>
            <NFTAvatar
              url={transfer.asset.nftMetadata.imagePreviewUrl}
              size={size}
            />
            <View className='flex flex-1 flex-col'>
              <Text
                className='text-text-primary overflow-hidden truncate text-xs font-medium'
                numberOfLines={1}
              >
                {transfer.asset.collectionMetadata.name}
              </Text>
              <Text
                className='text-text-secondary overflow-hidden truncate text-xs font-normal'
                numberOfLines={1}
              >
                {`#${transfer.asset.tokenId}`}
              </Text>
            </View>
          </View>
          <View className='flex flex-col pr-4'>
            <Text className='text-failure overflow-hidden truncate pr-1 text-right text-xs font-medium'>
              {`-${transfer.value}`}
            </Text>
          </View>
        </View>
      )}
      <View
        className='-my-1 items-center justify-center'
        style={withSize(size)}
      >
        <FontAwesomeIcon
          icon={faAnglesDown}
          size={adjust(16, 2)}
          color={colors.failure}
        />
      </View>
      <View className='flex flex-row items-center space-x-4'>
        {wallet ? (
          <WalletAvatar size={size} wallet={wallet} borderColor={colors.card} />
        ) : contact ? (
          <ContactAvatar contact={contact} size={size} />
        ) : (
          <WalletIcon size={size} defaultStyle='neutral' />
        )}
        <View className='flex-1'>
          <View className='flex flex-row'>
            <Text className='text-text-primary truncate text-xs font-medium'>
              {name}
            </Text>
          </View>
          <BaseButton onPress={() => copy(transfer.recipient)}>
            <View className='flex flex-row items-center space-x-1'>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(transfer.recipient)}
              </Text>
              <FontAwesomeIcon
                icon={faClone}
                size={adjust(10, 2)}
                color={colors.textSecondary}
              />
            </View>
          </BaseButton>
        </View>
      </View>
    </View>
  );
}
