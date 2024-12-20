import {
  faBolt,
  faChevronDown,
  faCircleNodes,
  faClock,
  faCodeCommit,
  faFireFlameSimple,
  faGlobe,
  faHashtag,
  faHexagonDivide,
  faSignature,
  faWallet,
} from '@fortawesome/pro-light-svg-icons';
import { faClone } from '@fortawesome/pro-regular-svg-icons';
import { faSackDollar } from '@fortawesome/pro-solid-svg-icons';
import { SafeInfoResponse } from '@safe-global/api-kit';
import cn from 'classnames';
import { DateTime } from 'luxon';
import { styled } from 'nativewind';
import { Linking, StyleProp, ViewStyle } from 'react-native';
import { formatAddress, formatHash } from '../../common/format/address';
import { formatEVMAddress } from '../../common/format/evm';
import { formatCrypto, formatMoney } from '../../common/format/number';
import { formatDate } from '../../common/format/time';
import { ISignerWallet, Loadable, Origin } from '../../common/types';
import { withHttps } from '../../common/utils/functions';
import { onLoadable } from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { ContactAvatar } from '../../components/avatar/contact-avatar';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainInfo } from '../../features/chain';
import { SafeSignerInfo } from '../../features/proposal/signer';
import { SafeTxState } from '../../features/safe/utils';
import {
  IContact,
  IInteractedAddress,
  ITokenMetadata,
  IWallet,
} from '../../graphql/client/generated/graphql';

export const WalletInfoItem = styled(function (props: {
  wallet: IWallet;
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { wallet, onCopy, style } = props;

  const size = adjust(12, 2);

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faWallet}
            size={size}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            Wallet
          </Text>
        </View>
        <BaseButton onPress={onCopy ? () => onCopy(wallet.address) : undefined}>
          <View className='flex flex-row items-center space-x-2'>
            <WalletAvatar
              wallet={wallet}
              size={adjust(16, 2)}
              borderColor={colors.card}
            />
            <Text className='text-text-primary text-xs font-normal'>
              {wallet.name}
            </Text>
            {onCopy && (
              <FontAwesomeIcon
                icon={faClone}
                size={size}
                color={colors.textPrimary}
              />
            )}
          </View>
        </BaseButton>
      </View>
    </View>
  );
});

export const NetworkInfoItem = styled(function (props: {
  chainInfo: ChainInfo;
  style?: StyleProp<ViewStyle>;
}) {
  const { chainInfo, style } = props;
  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faCircleNodes}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            Network
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <ChainAvatar chainInfo={chainInfo} size={adjust(16, 2)} />
          <Text
            className='text-xs font-normal'
            style={{ color: chainInfo.color }}
          >
            {chainInfo.name}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const OriginInfoItem = styled(function (props: {
  origin: Origin;
  style?: StyleProp<ViewStyle>;
}) {
  const { origin, style } = props;
  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faGlobe}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            Origin
          </Text>
        </View>
        <View className='flex w-1/2 flex-row items-center justify-end space-x-2'>
          <Image
            source={{ uri: origin.favIconUrl }}
            style={{
              ...withSize(adjust(16, 2)),
              borderRadius: 9999,
              backgroundColor: colors.card,
            }}
          />
          <Text
            className='text-link truncate text-xs font-normal underline'
            onPress={() => origin.url && Linking.openURL(withHttps(origin.url))}
            numberOfLines={1}
          >
            {origin.title}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const SafeSignatureInfoItem = styled(function (props: {
  signer?: ISignerWallet;
  safeInfo: SafeInfoResponse;
  signatures: string[];
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { signer, safeInfo, signatures, onPress, style } = props;
  const isComplete = signatures.length >= safeInfo.threshold;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <View className='flex flex-row items-center space-x-2'>
            <FontAwesomeIcon
              icon={faSignature}
              size={adjust(14, 2)}
              color={colors.textSecondary}
            />
            <Text className='text-text-secondary text-xs font-normal'>
              Signer
            </Text>
          </View>
        </View>
        <BaseButton
          animationEnabled={false}
          rippleEnabled={false}
          onPress={onPress}
        >
          {signer && !isComplete ? (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-1'>
              <WalletAvatar
                wallet={signer}
                size={adjust(16, 2)}
                borderColor={colors.cardHighlight}
              />
              <Text className='text-text-primary text-xs font-normal'>
                {signer.name}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          ) : (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-0.5'>
              <Text className='text-text-primary text-xs font-normal'>
                {isComplete ? 'Done' : 'Select a signer'}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          )}
        </BaseButton>
      </View>
    </View>
  );
});

export const SafeThresholdInfoItem = styled(function (props: {
  obtained: number;
  required: number;
  hideStatus?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { obtained, required, hideStatus, style } = props;
  const isComplete = obtained >= required;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <View className='flex flex-row items-center space-x-2'>
            <FontAwesomeIcon
              icon={faHexagonDivide}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
            <Text className='text-text-secondary text-xs font-normal'>
              Threshold
            </Text>
          </View>
        </View>
        <View className='flex flex-row items-center space-x-3'>
          {!hideStatus && (
            <View
              className={cn('rounded-full px-2 py-0.5', {
                'bg-failure/10': !isComplete,
                'bg-success/10': isComplete,
              })}
            >
              <Text
                className={cn('text-xs font-normal', {
                  'text-failure': !isComplete,
                  'text-success': isComplete,
                })}
              >
                {isComplete ? 'Complete' : `${required - obtained} remaining`}
              </Text>
            </View>
          )}
          <Text className='text-text-primary text-xs font-normal'>
            {`${obtained} / ${required}`}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const SafeSignerInfoItem = styled(function (props: {
  signer: SafeSignerInfo;
  index: number;
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { signer, index, onCopy, style } = props;

  const known = signer.signer || signer.contact;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <View className='flex flex-row items-center space-x-2'>
            <FontAwesomeIcon
              icon={faSignature}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
            <Text className='text-text-secondary text-xs font-normal'>
              {`Signer ${index}`}
            </Text>
          </View>
        </View>
        <BaseButton onPress={onCopy ? () => onCopy(signer.address) : undefined}>
          <View className='flex flex-row items-center space-x-2'>
            <View>
              {signer.signer ? (
                <WalletAvatar
                  wallet={signer.signer}
                  size={adjust(16, 2)}
                  borderColor={colors.card}
                />
              ) : signer.contact ? (
                <ContactAvatar contact={signer.contact} size={adjust(16, 2)} />
              ) : null}
            </View>
            <Text className='text-text-primary text-xs font-normal'>
              {known ? known.name : formatEVMAddress(signer.address)}
            </Text>
            {onCopy && (
              <FontAwesomeIcon
                icon={faClone}
                color={colors.textPrimary}
                size={adjust(12, 2)}
              />
            )}
          </View>
        </BaseButton>
      </View>
    </View>
  );
});

export const ExecutorInfoItem = styled(function (props: {
  executor?: ISignerWallet | null;
  loading?: boolean;
  onPress: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { executor, loading, onPress, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faBolt}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            Executor
          </Text>
        </View>
        <BaseButton
          animationEnabled={false}
          rippleEnabled={false}
          disabled={!!loading}
          onPress={onPress}
        >
          {loading ? (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-1'>
              <ActivityIndicator
                size={adjust(16, 2)}
                color={colors.textSecondary}
              />
              <Text className='text-text-secondary text-xs font-normal'>
                {'Loading...'}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          ) : executor ? (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-1'>
              <WalletAvatar
                wallet={executor}
                size={adjust(16, 2)}
                borderColor={colors.card}
              />
              <Text className='text-text-primary text-xs font-normal'>
                {executor.name}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          ) : executor === null ? (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-1'>
              <FontAwesomeIcon
                icon={faBolt}
                size={adjust(16, 2)}
                color={colors.textSecondary}
              />
              <Text className='text-text-primary text-xs font-normal'>
                {'Relayed'}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          ) : (
            <View className='bg-card-highlight flex flex-row items-center space-x-2 rounded-full px-2 py-1'>
              <Text className='text-text-primary text-xs font-normal'>
                {'Select an executor'}
              </Text>
              <FontAwesomeIcon
                icon={faChevronDown}
                size={adjust(8, 2)}
                color={colors.textSecondary}
              />
            </View>
          )}
        </BaseButton>
      </View>
    </View>
  );
});

export const HashInfoItem = styled(function (props: {
  hash: string;
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { hash, onCopy, style } = props;
  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faCodeCommit}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>Hash</Text>
        </View>
        <BaseButton onPress={onCopy ? () => onCopy(hash) : undefined}>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-xs font-normal'>
              {formatHash(hash)}
            </Text>
            {onCopy && (
              <FontAwesomeIcon
                icon={faClone}
                color={colors.textPrimary}
                size={adjust(12, 2)}
              />
            )}
          </View>
        </BaseButton>
      </View>
    </View>
  );
});

export const TimeInfoItem = styled(function (props: {
  type: 'start' | 'end';
  date: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { type, date, style } = props;

  const formatTime = (dateString: string) => {
    const date = DateTime.fromISO(dateString);
    return date.toLocaleString(DateTime.TIME_SIMPLE);
  };

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faClock}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            {type === 'end' ? 'Confirmation Time' : 'Created At'}
          </Text>
        </View>

        <View className='flex flex-row items-center space-x-2'>
          <Text className='text-text-primary text-xs font-normal'>
            {formatDate(date)} {formatTime(date)}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const CompleteExecutorInfoItem = styled(function (props: {
  executor: string;
  wallets: IWallet[];
  contacts: IContact[];
  onCopy?: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { executor, wallets, contacts, onCopy, style } = props;

  const wallet = wallets.find((wallet) => wallet.address === executor);
  const contact = contacts.find((contact) => contact.address === executor);
  const known = wallet || contact;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faBolt}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            Executor
          </Text>
        </View>
        <BaseButton onPress={onCopy ? () => onCopy(executor) : undefined}>
          <View className='flex flex-row items-center space-x-2'>
            <View>
              {wallet ? (
                <WalletAvatar
                  wallet={wallet}
                  size={adjust(16, 2)}
                  borderColor={colors.card}
                />
              ) : contact ? (
                <ContactAvatar contact={contact} size={adjust(16, 2)} />
              ) : null}
            </View>
            <Text className='text-text-primary text-xs font-normal'>
              {known ? known.name : formatAddress(executor)}
            </Text>
            {onCopy && (
              <FontAwesomeIcon
                icon={faClone}
                color={colors.textPrimary}
                size={adjust(12, 2)}
              />
            )}
          </View>
        </BaseButton>
      </View>
    </View>
  );
});

export const NetworkFeeInfoItem = styled(function (props: {
  gasFee: string;
  gasToken: ITokenMetadata;
  gasUSD: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { gasFee, gasUSD, gasToken, style } = props;

  const isRefund = gasFee.startsWith('-');

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={isRefund ? faSackDollar : faFireFlameSimple}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>
            {isRefund ? 'Network Refund' : 'Network Fee'}
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          <View className='bg-card-highlight rounded-full px-2 py-0.5'>
            <Text className='text-text-secondary text-xs font-normal'>
              {formatMoney(Math.abs(gasUSD))}
            </Text>
          </View>
          <Text className='text-text-primary text-xs font-normal'>
            {`${formatCrypto(
              isRefund ? gasFee.slice(1) : gasFee,
              gasToken.decimals,
            )} ${gasToken.symbol}`}
          </Text>
        </View>
      </View>
    </View>
  );
});

export const SafeNonceInfoItem = styled(function (props: {
  safeInfo: SafeInfoResponse;
  safeNonce: number;
  proposalState: SafeTxState;
  onEditNonce: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { safeInfo, safeNonce, proposalState, onEditNonce, style } = props;

  return (
    <View style={style}>
      <View className='flex flex-row justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <FontAwesomeIcon
            icon={faHashtag}
            size={adjust(12, 2)}
            color={colors.textSecondary}
          />
          <Text className='text-text-secondary text-xs font-normal'>Nonce</Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          {(proposalState === SafeTxState.NotCreated ||
            proposalState === SafeTxState.MissingSignature ||
            proposalState === SafeTxState.ReadyToExecute) && (
            <View
              className={cn(
                'items-center justify-center rounded-full px-2 py-0.5',
                {
                  'bg-success/10': safeNonce === safeInfo.nonce,
                  'bg-primary/10': safeNonce > safeInfo.nonce,
                  'bg-failure/10': safeNonce < safeInfo.nonce,
                },
              )}
            >
              <Text
                className={cn('text-xs font-normal', {
                  'text-success': safeNonce === safeInfo.nonce,
                  'text-primary': safeNonce > safeInfo.nonce,
                  'text-failure': safeNonce < safeInfo.nonce,
                })}
              >
                {safeNonce === safeInfo.nonce
                  ? 'Next'
                  : safeNonce < safeInfo.nonce
                  ? 'Expired'
                  : `#${safeNonce - safeInfo.nonce + 1} in Queue`}
              </Text>
            </View>
          )}
          <BaseButton
            animationEnabled={false}
            rippleEnabled={false}
            disabled={proposalState !== SafeTxState.NotCreated}
            onPress={onEditNonce}
          >
            <View
              className={cn('flex flex-row items-center space-x-2', {
                'bg-card-highlight rounded-full px-2 py-0.5':
                  proposalState === SafeTxState.NotCreated,
              })}
            >
              <Text className='text-text-primary text-xs font-normal'>
                {safeNonce}
              </Text>
              {proposalState === SafeTxState.NotCreated && (
                <FontAwesomeIcon
                  icon={faChevronDown}
                  size={adjust(8, 2)}
                  color={colors.textSecondary}
                />
              )}
            </View>
          </BaseButton>
        </View>
      </View>
    </View>
  );
});

export const InteractionsCountItem = styled(function (props: {
  interaction: Loadable<IInteractedAddress>;
  style?: StyleProp<ViewStyle>;
}) {
  const { interaction, style } = props;

  // TODO: add loading state
  return onLoadable(interaction)(
    () => null,
    () => null,
    (interaction) => (
      <View style={style}>
        <View className='flex flex-row justify-between'>
          <View className='flex flex-row items-center space-x-2'>
            <FontAwesomeIcon
              icon={faHashtag}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
            <Text className='text-text-secondary text-xs font-normal'>
              Previous Interactions
            </Text>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary text-xs font-normal'>
              {interaction.interactionCount}
            </Text>
          </View>
        </View>
      </View>
    ),
  );
});
