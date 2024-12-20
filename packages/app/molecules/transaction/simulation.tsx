import {
  faClone,
  faExclamation,
  faMoneyCheck,
} from '@fortawesome/pro-regular-svg-icons';
import { faAnglesDown } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { formatAddress } from '../../common/format/address';
import { BridgeData } from '../../common/types';
import { opacity, opaque } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { ContactAvatar } from '../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { BaseButton } from '../../components/button/base-button';
import { ChainChip } from '../../components/chip';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { WalletIcon } from '../../components/wallet-icon';
import { SCREEN_WIDTH, colors } from '../../design/constants';
import { lifiAddress } from '../../features/evm/constants';
import {
  jitoTipAddress,
  temporalTipAddress,
} from '../../features/svm/constants';
import {
  IBridgeStatus,
  IContact,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { GenericSimulationInfo } from '../simulation/skeletons';
import { TokenTransferItem } from './transaction-item';

export function TransactionBridgeTracker(props: { bridgeData: BridgeData }) {
  const { bridgeData } = props;

  const Progress = (props: {
    state: 'done' | 'pending' | 'not_started';
    end: boolean;
    text: string;
  }) => {
    const { state, end, text } = props;
    return (
      <View className='-mt-[1px] flex flex-col items-center'>
        {state !== 'not_started' && (
          <View
            className='absolute -top-1 left-8'
            style={{ width: SCREEN_WIDTH - 80 }}
          >
            <Text className='text-text-secondary text-xs font-normal'>
              {text}
            </Text>
          </View>
        )}
        {state !== 'pending' ? (
          <View
            className={cn('z-10 h-2 w-2 rounded-full', {
              'bg-swap-light': state === 'done',
              'bg-card-highlight': state === 'not_started',
            })}
          />
        ) : (
          <View
            className='z-10 h-2 w-2 rounded-full'
            style={{
              backgroundColor: opaque(colors.swapLight, colors.card, 20),
            }}
          >
            <ActivityIndicator size={8} color={colors.swapLight} />
          </View>
        )}
        {!end && (
          <View
            className={cn('-mt-[1px] h-8 w-0.5', {
              'bg-swap-light': state === 'done',
              'bg-card-highlight': state !== 'done',
            })}
          />
        )}
      </View>
    );
  };

  if (bridgeData.bridgeStatus === IBridgeStatus.Failed) {
    return (
      <GenericSimulationInfo
        title='Bridge Failed'
        body={
          'Your bridge has failed to complete and your tokens will be refunded.'
        }
        icon={faExclamation}
        iconColor={colors.failure}
        iconBackgroundColor={opacity(colors.failure, 10)}
        size='large'
      />
    );
  } else if (bridgeData.bridgeStatus === IBridgeStatus.Refunding) {
    return (
      <GenericSimulationInfo
        title='Refunding'
        body={'Refunding your tokens due to bridge failure...'}
        icon={faExclamation}
        iconColor={colors.swapLight}
        iconBackgroundColor={opacity(colors.swapLight, 10)}
        loading={true}
        size='large'
      />
    );
  } else if (bridgeData.bridgeStatus === IBridgeStatus.Refunded) {
    return (
      <GenericSimulationInfo
        title='Refunded'
        body={
          'Your bridge has failed to complete and your tokens have been refunded.'
        }
        icon={faMoneyCheck}
        iconColor={colors.swapLight}
        iconBackgroundColor={opacity(colors.swapLight, 10)}
        size='large'
      />
    );
  }

  return (
    <View className='bg-card flex flex-row items-center space-x-4 rounded-xl py-2 pl-2'>
      <View className='flex flex-col items-center'>
        <Progress
          state={
            bridgeData.bridgeStatus === IBridgeStatus.NotInitiated
              ? 'pending'
              : 'done'
          }
          end={false}
          text={
            bridgeData.bridgeStatus === IBridgeStatus.NotInitiated
              ? 'Broadcasting request to bridge...'
              : 'Bridging request broadcast'
          }
        />
        <Progress
          state={
            bridgeData.bridgeStatus === IBridgeStatus.WaitSourceConfirm
              ? 'pending'
              : bridgeData.bridgeStatus !== IBridgeStatus.NotInitiated
              ? 'done'
              : 'not_started'
          }
          end={false}
          text={
            bridgeData.bridgeStatus === IBridgeStatus.WaitSourceConfirm
              ? 'Processing bridge on source chain...'
              : 'Source chain bridging complete'
          }
        />
        <Progress
          state={
            bridgeData.bridgeStatus === IBridgeStatus.Complete ||
            bridgeData.bridgeStatus === IBridgeStatus.Partial
              ? 'done'
              : bridgeData.bridgeStatus === IBridgeStatus.WaitDestinationConfirm
              ? 'pending'
              : 'not_started'
          }
          end={true}
          text={
            bridgeData.bridgeStatus === IBridgeStatus.Complete
              ? 'Bridge successful!'
              : bridgeData.bridgeStatus === IBridgeStatus.Partial
              ? 'Bridged alternative tokens due to low liquidity'
              : 'Processing bridge on destination chain...'
          }
        />
      </View>
    </View>
  );
}

export function TransactionBridge(props: {
  bridgeData: BridgeData;
  wallet: IWallet;
  contacts?: IContact[];
  wallets?: IWallet[];
  onCopyAddress: (text: string) => void;
  onCopyToken: (text: string) => void;
}) {
  const { bridgeData, wallet, contacts, wallets, onCopyAddress, onCopyToken } =
    props;

  return bridgeData.legacy ? (
    <View className='flex flex-col py-2'>
      <TokenTransferItem
        address={bridgeData.bridgeData.expectedRecipientAddress}
        event={{
          from: wallet.address,
          to: bridgeData.bridgeData.expectedRecipientAddress,
          quantity: bridgeData.bridgeData.expectedTokenAmount,
          tokenMetadata: bridgeData.bridgeData.expectedTokenMetadata,
        }}
        onCopy={onCopyToken}
      />
      <TransferRecipient
        transferRecipient={bridgeData.bridgeData.expectedRecipientAddress}
        contacts={contacts}
        wallets={wallets}
        chainId={bridgeData.bridgeData.chainId}
        onCopy={onCopyAddress}
      />
      <View className='absolute bottom-3 right-0'>
        <ChainChip chainId={bridgeData.bridgeData.chainId} />
      </View>
    </View>
  ) : (
    <View className='flex flex-col py-2'>
      <TokenTransferItem
        address={bridgeData.bridgeData.recipientAddress}
        event={{
          from: wallet.address,
          to: bridgeData.bridgeData.recipientAddress,
          quantity: bridgeData.bridgeData.outTokenAmount,
          tokenMetadata: bridgeData.bridgeData.outTokenMetadata,
        }}
        onCopy={onCopyToken}
      />
      <TransferRecipient
        transferRecipient={bridgeData.bridgeData.recipientAddress}
        contacts={contacts}
        wallets={wallets}
        chainId={bridgeData.bridgeData.toChainId}
        onCopy={onCopyAddress}
      />
      <View className='absolute bottom-3 right-0'>
        <ChainChip chainId={bridgeData.bridgeData.toChainId} />
      </View>
    </View>
  );
}

export function TransferRecipient(props: {
  transferRecipient: string;
  chainId: number;
  wallets?: IWallet[];
  contacts?: IContact[];
  onCopy?: (text: string) => void;
}) {
  const {
    transferRecipient,
    chainId,
    wallets = [],
    contacts = [],
    onCopy,
  } = props;

  const contact = contacts.find(
    (contact) => transferRecipient === contact.address,
  );
  const wallet = wallets.find(
    (wallet) =>
      transferRecipient === wallet.address &&
      (wallet.chainId === chainId || wallet.chainId === 0),
  );
  const name = wallet?.name || contact?.name || '';
  const defaultName =
    transferRecipient === lifiAddress
      ? 'LI.FI Diamond'
      : transferRecipient === jitoTipAddress
      ? 'Jito Tip Account 5'
      : transferRecipient === temporalTipAddress
      ? 'Temporal Tip Account'
      : 'Unknown Address';
  const size = adjust(24);

  return (
    <View className='flex flex-col'>
      <View className='my-1 items-center justify-center' style={withSize(size)}>
        <FontAwesomeIcon
          icon={faAnglesDown}
          size={adjust(16, 2)}
          color={colors.failure}
        />
      </View>
      <View className='flex flex-row items-center space-x-4 pr-4'>
        {wallet ? (
          <WalletAvatar size={size} wallet={wallet} borderColor={colors.card} />
        ) : contact ? (
          <ContactAvatar contact={contact} size={size} />
        ) : (
          <WalletIcon size={size} defaultStyle='neutral' />
        )}
        <View className='flex flex-col'>
          <Text
            className='text-text-primary truncate text-xs font-medium'
            numberOfLines={1}
          >
            {name || defaultName}
          </Text>
          <BaseButton
            onPress={onCopy ? () => onCopy(transferRecipient) : undefined}
          >
            <View className='flex flex-row items-center space-x-1'>
              <Text className='text-text-secondary text-xs font-normal'>
                {formatAddress(transferRecipient)}
              </Text>
              {onCopy && (
                <FontAwesomeIcon
                  icon={faClone}
                  size={adjust(12, 2)}
                  color={colors.textSecondary}
                />
              )}
            </View>
          </BaseButton>
        </View>
      </View>
    </View>
  );
}
