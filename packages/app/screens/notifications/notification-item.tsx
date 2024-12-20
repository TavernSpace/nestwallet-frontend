import { DateTime } from 'luxon';
import { formatEVMAddress, formatHex } from '../../common/format/evm';
import { formatCrypto } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { adjust, withSize } from '../../common/utils/style';
import { UserAvatar } from '../../components/avatar/user-avatar';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { BadgeDot } from '../../components/badge';
import { BaseButton } from '../../components/button/base-button';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import {
  INotification,
  INotificationType,
  IUserPublic,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';

export const NotificationItem = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;

  if (
    notification.type === INotificationType.ProposalCreated &&
    notification.transactionProposalEntity &&
    notification.transactionProposalEntity.safe
  ) {
    return (
      <NotificationItemTransactionProposalCreated
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.ProposalSigned &&
    notification.transactionProposalEntity &&
    notification.transactionProposalEntity.safe
  ) {
    return (
      <NotificationItemTransactionProposalSigned
        notification={notification}
        onPress={onPress}
      />
    );
    // TODO: maybe should also cache executor in metadata in case of reorg
  } else if (
    notification.type === INotificationType.ProposalExecuted &&
    notification.transactionProposalEntity &&
    notification.transactionProposalEntity.safe &&
    notification.transactionProposalEntity.safe.executor
  ) {
    return (
      <NotificationItemTransactionProposalExecuted
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.MessageProposalCreated &&
    notification.messageProposalEntity &&
    notification.messageProposalEntity.safe
  ) {
    return (
      <NotificationItemMessageProposalCreated
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.MessageProposalSigned &&
    notification.messageProposalEntity &&
    notification.messageProposalEntity.safe
  ) {
    return (
      <NotificationItemMessageProposalSigned
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.ReceivedEther &&
    notification.walletEntity &&
    notification.receivedEtherMetadata
  ) {
    return (
      <NotificationItemReceivedEther
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.ReceivedErc20 &&
    notification.walletEntity &&
    notification.receivedERC20Metadata
  ) {
    return (
      <NotificationItemReceivedERC20
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.ReceivedErc721 &&
    notification.walletEntity &&
    notification.receivedERC721Metadata
  ) {
    return (
      <NotificationItemReceivedERC721
        notification={notification}
        onPress={onPress}
      />
    );
  } else if (
    notification.type === INotificationType.LimitOrderExecuted &&
    notification.walletEntity &&
    notification.limitOrderExecutedMetadata
  ) {
    return (
      <NotificationItemLimitOrderExecuted
        notification={notification}
        onPress={onPress}
      />
    );
  }

  return null;
};

const NotificationRequestBase = (props: {
  notification: INotification;
  onPress: VoidFunction;
  actors: string[];
  action: string;
  wallet: IWallet;
  description: string;
  user?: IUserPublic;
}) => {
  const { notification, onPress, actors, action, wallet, description, user } =
    props;

  const time = DateTime.fromISO(notification.updatedAt);
  const size = adjust(36);

  return (
    <View className='w-full'>
      <BaseButton
        className='hover:bg-card-highlight'
        onPress={onPress}
        animationEnabled={false}
      >
        <View className='bg-background flex flex-col space-y-2 p-4'>
          <View className='flex w-full flex-row items-center space-x-4'>
            <UserAvatar
              user={user ?? undefined}
              imageUrl={
                !user
                  ? 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/safe-logo.jpeg'
                  : undefined
              }
              size={size}
            />
            <View className='flex flex-1 flex-col space-y-1'>
              <View className='flex flex-row items-center space-x-1'>
                <Text className='text-text-primary text-sm font-normal'>
                  {actors.length === 0 ? (
                    ''
                  ) : actors.length === 1 ? (
                    <Text className='text-sm font-medium'>{actors[0]!}</Text>
                  ) : (
                    <Text className='text-sm'>
                      {actors
                        .slice(0, actors.length - 2)
                        .map((actor, index) => (
                          <Text key={index}>
                            <Text className='text-sm font-medium'>{actor}</Text>
                            <Text className='text-sm'>{', '}</Text>
                          </Text>
                        ))}
                      <Text className='text-sm font-medium'>
                        {actors[actors.length - 2]}
                      </Text>
                      <Text className='text-sm'> and </Text>
                      <Text className='text-sm font-medium'>
                        {actors[actors.length - 1]}
                      </Text>
                    </Text>
                  )}
                  <Text className='text-sm'>{` ${action}`}</Text>
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-2'>
                {!notification.isRead && <BadgeDot hidden={false} />}
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${time.toFormat('DD')} • ${wallet.name}`}
                </Text>
              </View>
            </View>
          </View>
          {description !== '' && (
            <View className='flex flex-row items-center space-x-4'>
              <View style={withSize(size)} />
              <View className='bg-card flex-1 rounded-xl px-3 py-3'>
                <Text className='text-text-secondary text-xs font-normal leading-normal'>
                  {description}
                </Text>
              </View>
            </View>
          )}
        </View>
      </BaseButton>
    </View>
  );
};

export const NotificationItemTransactionProposalCreated = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const proposal = notification.transactionProposalEntity!.safe!;

  return (
    <NotificationRequestBase
      notification={notification}
      onPress={onPress}
      actors={[localization.you[language]]}
      action={localization.createdAProposal[language]}
      wallet={proposal.wallet}
      description={proposal.description}
      user={proposal.createdBy ?? undefined}
    />
  );
};

export const NotificationItemTransactionProposalSigned = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const proposal = notification.transactionProposalEntity!.safe!;
  const confirmations = [...proposal.confirmations].sort(
    (conf1, conf2) =>
      DateTime.fromISO(conf1.timestamp).toUnixInteger() -
      DateTime.fromISO(conf2.timestamp).toUnixInteger(),
  );

  if (confirmations.length === 0) {
    return null;
  }

  return (
    <NotificationRequestBase
      notification={notification}
      onPress={onPress}
      actors={confirmations.map((conf) => {
        const signer = formatEVMAddress(conf.signer)!;
        return conf.user
          ? localization.youWithWalletName(signer)[language]
          : signer;
      })}
      action={localization.signedAProposal[language]}
      wallet={proposal.wallet}
      description={proposal.description}
      user={confirmations[confirmations.length - 1]?.user ?? undefined}
    />
  );
};

export const NotificationItemTransactionProposalExecuted = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const proposal = notification.transactionProposalEntity!.safe!;
  const executor = formatEVMAddress(proposal.executor)!;
  const actor = proposal.executedBy
    ? localization.youWithWalletName(executor)[language]
    : executor;

  return (
    <NotificationRequestBase
      notification={notification}
      onPress={onPress}
      actors={[actor]}
      action={localization.executedAProposal[language]}
      wallet={proposal.wallet}
      description={proposal.description}
      user={proposal.executedBy ?? undefined}
    />
  );
};

export const NotificationItemMessageProposalCreated = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const messageProposal = notification.messageProposalEntity!.safe!;

  return (
    <NotificationRequestBase
      notification={notification}
      onPress={onPress}
      actors={[localization.you[language]]}
      action={localization.createdAMessage[language]}
      wallet={messageProposal.wallet}
      description={messageProposal.description}
      user={messageProposal.createdBy ?? undefined}
    />
  );
};

export const NotificationItemMessageProposalSigned = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const messageProposal = notification.messageProposalEntity!.safe!;
  const confirmations = [...messageProposal.confirmations].sort(
    (conf1, conf2) =>
      DateTime.fromISO(conf1.timestamp).toUnixInteger() -
      DateTime.fromISO(conf2.timestamp).toUnixInteger(),
  );

  if (confirmations.length === 0) {
    return null;
  }

  return (
    <NotificationRequestBase
      notification={notification}
      onPress={onPress}
      actors={confirmations.map((conf) => {
        const userName = conf.user?.name || conf.user?.email;
        const signer = formatEVMAddress(conf.signer)!;
        return userName
          ? localization.youWithWalletName(signer)[language]
          : signer;
      })}
      action={localization.signedAMessage[language]}
      wallet={messageProposal.wallet}
      description={messageProposal.description}
      user={confirmations[confirmations.length - 1]?.user ?? undefined}
    />
  );
};

export const NotificationItemReceivedEther = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const wallet = notification.walletEntity!;
  const metadata = notification.receivedEtherMetadata!;
  const time = DateTime.fromISO(notification.createdAt);

  // TODO: for now we don't have a good way to get the sender, for now just display the tx hash
  return (
    <View className='w-full'>
      <BaseButton
        className='hover:bg-card-highlight'
        onPress={onPress}
        animationEnabled={false}
      >
        <View className='bg-background flex flex-row items-center justify-between p-4'>
          <View className='flex w-full flex-row items-center space-x-4'>
            <WalletAvatar wallet={wallet} size={adjust(36)} />
            <View className='flex flex-1 flex-col space-y-1'>
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm'>
                  <Text className='text-sm font-medium'>
                    {
                      localization.receivedAmountAndSymbol(
                        formatCrypto(
                          metadata.value,
                          metadata.tokenMetadata.decimals,
                          NumberType.TokenTx,
                        ),
                        metadata.tokenMetadata.symbol,
                      )[language]
                    }
                  </Text>
                  <Text className='text-sm font-normal'>
                    {
                      localization.fromTransactionDiamond(
                        formatHex(metadata.transaction.transactionHash),
                      )[language]
                    }
                  </Text>
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-2'>
                {!notification.isRead && <BadgeDot hidden={false} />}
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${time.toFormat('DD')} • ${wallet.name}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </BaseButton>
    </View>
  );
};

export const NotificationItemReceivedERC20 = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const wallet = notification.walletEntity!;
  const metadata = notification.receivedERC20Metadata!;
  const time = DateTime.fromISO(notification.createdAt);

  // TODO: for now we don't have a good way to get the sender, for now just display the tx hash
  return (
    <View className='w-full'>
      <BaseButton
        className='hover:bg-card-highlight'
        onPress={onPress}
        animationEnabled={false}
      >
        <View className='bg-background flex flex-row items-center justify-between p-4'>
          <View className='flex w-full flex-row items-center space-x-4'>
            <WalletAvatar wallet={wallet} size={adjust(36)} />
            <View className='flex flex-1 flex-col space-y-1'>
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm'>
                  <Text className='text-sm font-medium'>
                    {
                      localization.receivedAmountAndSymbol(
                        formatCrypto(
                          metadata.value,
                          metadata.tokenMetadata.decimals,
                          NumberType.TokenTx,
                        ),
                        metadata.tokenMetadata.symbol,
                      )[language]
                    }
                  </Text>
                  <Text className='text-sm font-normal'>
                    {
                      localization.fromTransactionDiamond(
                        formatHex(metadata.transaction.transactionHash),
                      )[language]
                    }
                  </Text>
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-2'>
                {!notification.isRead && <BadgeDot hidden={false} />}
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${time.toFormat('DD')} • ${wallet.name}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </BaseButton>
    </View>
  );
};

export const NotificationItemReceivedERC721 = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();
  const wallet = notification.walletEntity!;
  const metadata = notification.receivedERC721Metadata!;
  const time = DateTime.fromISO(notification.createdAt);

  // TODO: for now we don't have a good way to get the sender, for now just display the tx hash
  // TODO: need to get nft metadata
  return (
    <View className='w-full'>
      <BaseButton
        className='hover:bg-card-highlight'
        onPress={onPress}
        animationEnabled={false}
      >
        <View className='bg-background flex flex-row items-center justify-between p-4'>
          <View className='flex w-full flex-row items-center space-x-4'>
            <WalletAvatar wallet={wallet} size={adjust(36)} />
            <View className='flex flex-1 flex-col space-y-1'>
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm'>
                  <Text className='text-sm font-medium'>
                    {
                      localization.receivedItem(
                        formatEVMAddress(metadata.contractAddress),
                        metadata.tokenId,
                      )[language]
                    }
                  </Text>
                  <Text className='text-sm font-normal'>
                    {
                      localization.fromTransactionPicture(
                        formatHex(metadata.transaction.transactionHash),
                      )[language]
                    }
                  </Text>
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-2'>
                {!notification.isRead && <BadgeDot hidden={false} />}
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${time.toFormat('DD')} • ${wallet.name}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </BaseButton>
    </View>
  );
};

export const NotificationItemLimitOrderExecuted = (props: {
  notification: INotification;
  onPress: VoidFunction;
}) => {
  const { notification, onPress } = props;
  const { language } = useLanguageContext();

  const wallet = notification.walletEntity!;
  const metadata = notification.limitOrderExecutedMetadata!;
  const time = DateTime.fromISO(notification.createdAt);

  return (
    <View className='w-full'>
      <BaseButton
        className='hover:bg-card-highlight'
        onPress={onPress}
        animationEnabled={false}
      >
        <View className='bg-background flex flex-row items-center justify-between p-4'>
          <View className='flex w-full flex-row items-center space-x-4'>
            <WalletAvatar wallet={wallet} size={adjust(36)} />
            <View className='flex flex-1 flex-col space-y-1'>
              <View className='flex flex-row'>
                <Text className='text-text-primary text-sm'>
                  {
                    localization.limitOrderExecuted(
                      metadata.limitOrderType,
                      metadata.primaryTokenSymbol,
                      metadata.executionPrice,
                    )[language]
                  }
                </Text>
              </View>
              <View className='flex flex-row items-center space-x-2'>
                {!notification.isRead && <BadgeDot hidden={false} />}
                <Text className='text-text-secondary text-xs font-normal'>
                  {`${time.toFormat('DD')} • ${wallet.name}`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </BaseButton>
    </View>
  );
};
