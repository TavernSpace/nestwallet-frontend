import cn from 'classnames';
import { isNil } from 'lodash';
import { formatAddress } from '../../../common/format/address';
import { adjust } from '../../../common/utils/style';
import { ContactAvatar } from '../../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../../components/avatar/wallet-avatar';
import { ChainChip } from '../../../components/chip';
import { ListItem } from '../../../components/list/list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { WalletIcon } from '../../../components/wallet-icon';
import { lifiAddress } from '../../../features/evm/constants';
import {
  IContact,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';

export function AccountListItem(props: {
  name?: string;
  chainId: number;
  address: string;
  wallet?: IWallet;
  contact?: IContact;
  disabled?: boolean;
  duplicate?: boolean;
  interactionCount?: number;
  onPress: VoidFunction;
}) {
  const {
    name,
    address,
    wallet,
    contact,
    chainId,
    duplicate,
    disabled,
    onPress,
    interactionCount,
  } = props;

  const isSafe = wallet?.type === IWalletType.Safe;
  const isWrongNetwork = isSafe && wallet.chainId !== chainId;
  const defaultName =
    address === lifiAddress ? 'LI.FI Diamond' : 'Unknown Address';
  const size = adjust(36);

  return (
    <ListItem
      disabled={disabled || isWrongNetwork || duplicate}
      onPress={onPress}
    >
      <View className='flex flex-row items-center justify-between px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-4 '>
          {wallet ? (
            <WalletAvatar size={size} wallet={wallet} />
          ) : contact ? (
            <ContactAvatar size={size} contact={contact} />
          ) : (
            <WalletIcon size={size} defaultStyle='neutral' />
          )}
          <View className='flex flex-1 flex-row justify-between'>
            <View className='flex flex-1 flex-col'>
              <Text
                className='text-text-primary truncate text-sm font-medium'
                numberOfLines={1}
              >
                {name || defaultName}
              </Text>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(address)}
              </Text>
            </View>
            <View className='flex flex-col justify-center'>
              {!duplicate && isWrongNetwork && (
                <ChainChip
                  chainId={wallet.chainId === chainId ? wallet.chainId : 0}
                />
              )}
              {duplicate && (
                <View className='bg-failure/10 flex w-fit flex-col items-center justify-center rounded-full px-2 py-1'>
                  <Text className='text-failure text-xs font-medium'>
                    Sender Address
                  </Text>
                </View>
              )}
              {!isNil(interactionCount) && !duplicate && !isWrongNetwork && (
                <View
                  className={cn('rounded-full px-2 py-1', {
                    'bg-warning/10': interactionCount === 0,
                    'bg-primary/10':
                      interactionCount > 0 && interactionCount < 3,
                    'bg-success/10': interactionCount >= 3,
                  })}
                >
                  <Text
                    className={cn('text-xs font-medium', {
                      'text-warning': interactionCount === 0,
                      'text-primary':
                        interactionCount > 0 && interactionCount < 3,
                      'text-success': interactionCount >= 3,
                    })}
                  >
                    {`${
                      interactionCount === 0 ? 'No' : interactionCount
                    } Previous Send${interactionCount === 1 ? '' : 's'}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ListItem>
  );
}
