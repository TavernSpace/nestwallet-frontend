import {
  faBan,
  faBridgeWater,
  faChartRadar,
  faCoinFront,
  faMessageCode,
} from '@fortawesome/pro-regular-svg-icons';
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/pro-solid-svg-icons';
import { SafeInfoResponse } from '@safe-global/api-kit';
import { isEmpty, isNil } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import SafeLogo from '../../assets/images/logos/safe-logo-white.png';
import { useCopy } from '../../common/hooks/copy';
import {
  BridgeData,
  ISignerWallet,
  Loadable,
  Origin,
} from '../../common/types';
import { onLoadable } from '../../common/utils/query';
import { adjust, withSize } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { SafeSignerInfo } from '../../features/proposal/signer';
import { SafeTxState } from '../../features/safe/utils';
import {
  IBridgeStatus,
  IContact,
  IInteractedAddress,
  IMessageEvents,
  IMessageType,
  ITokenMetadata,
  ITransactionEvents,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import {
  NFTApprovalItem as MessageNFTApprovalItem,
  NFTTransferItem as MessageNFTTransferItem,
  TokenApprovalItem as MessageTokenApprovalItem,
  TokenTransferItem as MessageTokenTransferItem,
} from '../message/message-item';
import { FailureAction } from '../proposal/failure';
import { RejectionAction } from '../proposal/rejection';
import {
  SimulationSectionComplete,
  SimulationSectionEmpty,
  SimulationSectionError,
  SimulationSectionReplaced,
  SimulationSectionSkeleton,
} from '../simulation/skeletons';
import {
  CompleteExecutorInfoItem,
  ExecutorInfoItem,
  HashInfoItem,
  InteractionsCountItem,
  NetworkFeeInfoItem,
  NetworkInfoItem,
  OriginInfoItem,
  SafeNonceInfoItem,
  SafeSignatureInfoItem,
  SafeSignerInfoItem,
  SafeThresholdInfoItem,
  TimeInfoItem,
  WalletInfoItem,
} from './info-item';
import { TypedMessage } from './message';
import {
  TransactionBridge,
  TransactionBridgeTracker,
  TransferRecipient,
} from './simulation';
import {
  AddSafeOwnerItem,
  NFTApprovalItem,
  NFTTransferItem,
  RemoveSafeOwnerItem,
  SafeChangeThresholdItem,
  TokenApprovalItem,
  TokenTransferItem,
} from './transaction-item';

interface GasData {
  gasFee: string;
  gasToken: ITokenMetadata;
  gasFeeInUSD: number;
}

export const GeneralInfoCard = styled(function (props: {
  origin?: Origin;
  wallet?: IWallet;
  chainId?: ChainId;
  type: 'history' | 'proposal';
  initialCollapsed?: boolean;
  hash?: string;
  executor?: string;
  wallets?: IWallet[];
  contacts?: IContact[];
  gasData?: GasData;
  startDate?: string;
  endDate?: string;
  interaction?: Loadable<IInteractedAddress>;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    origin,
    wallet,
    type,
    chainId,
    initialCollapsed,
    hash,
    executor,
    wallets = [],
    contacts = [],
    gasData,
    startDate,
    endDate,
    interaction,
    style,
  } = props;
  const { copy } = useCopy('Copied address!');
  const { copy: copyHash } = useCopy('Copied hash!');

  const [collapsed, setCollapsed] = useState(
    initialCollapsed !== undefined
      ? initialCollapsed
      : type === 'history'
      ? false
      : true,
  );

  const canCollapse = type !== 'history';

  return (
    <InfoCard style={style} borderColor={colors.cardNeutralBright}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={!canCollapse ? undefined : () => setCollapsed(!collapsed)}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={faChartRadar}
                size={adjust(14, 2)}
                color={colors.textPrimary}
              />
              <Text className='text-text-primary text-sm font-medium'>
                {'General'}
              </Text>
            </View>
            {canCollapse ? (
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronDown}
                size={adjust(12, 2)}
                color={colors.textPrimary}
              />
            ) : (
              <View />
            )}
          </View>
        </BaseButton>
        {!collapsed && (
          <View className='flex flex-col space-y-3'>
            {origin && <OriginInfoItem origin={origin} />}
            {wallet && <WalletInfoItem wallet={wallet} />}
            {!!chainId && <NetworkInfoItem chainInfo={getChainInfo(chainId)} />}
            {interaction && <InteractionsCountItem interaction={interaction} />}
            {!!hash && <HashInfoItem hash={hash} onCopy={copyHash} />}
            {!!executor && !!chainId && (
              <CompleteExecutorInfoItem
                executor={executor}
                wallets={wallets}
                contacts={contacts}
                onCopy={copy}
              />
            )}
            {!!startDate && <TimeInfoItem type='start' date={startDate} />}
            {!!endDate && <TimeInfoItem type='end' date={endDate} />}
            {gasData && (
              <NetworkFeeInfoItem
                gasFee={gasData.gasFee}
                gasToken={gasData.gasToken}
                gasUSD={gasData.gasFeeInUSD}
              />
            )}
          </View>
        )}
      </View>
    </InfoCard>
  );
});

export const WalletChangeCard = styled(function (props: {
  wallet: IWallet;
  chainId: ChainId;
  type: 'history' | 'proposal';
  events: Loadable<ITransactionEvents>;
  rejectionNonce?: number;
  wallets?: IWallet[];
  contacts?: IContact[];
  isComplete?: boolean;
  isReplaced?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    wallet,
    chainId,
    type,
    events,
    rejectionNonce,
    wallets,
    contacts,
    isComplete,
    isReplaced,
    style,
  } = props;
  const { copy: copyAddress } = useCopy('Copied recipient address!');
  const { copy: copyApproval } = useCopy('Copied approval address!');
  const { copy: copyTokenAddress } = useCopy('Copied token address!');

  const [collapsed, setCollapsed] = useState(false);

  const isRejection = !isNil(rejectionNonce);
  const isFailedHistory = type === 'history' && !!events.data?.error;
  const canCollapse = type !== 'history';

  return (
    <InfoCard
      style={style}
      borderColor={
        isRejection || isFailedHistory ? colors.failure : colors.approve
      }
    >
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={!canCollapse ? undefined : () => setCollapsed(!collapsed)}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={isFailedHistory ? faBan : faCoinFront}
                size={adjust(14, 2)}
                color={colors.textPrimary}
              />
              <Text className='text-text-primary text-sm font-medium'>
                {isFailedHistory ? 'Failure Reason' : 'Wallet Changes'}
              </Text>
            </View>
            {canCollapse ? (
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronDown}
                size={adjust(12, 2)}
                color={colors.textPrimary}
              />
            ) : (
              <View />
            )}
          </View>
        </BaseButton>
        {!collapsed &&
          onLoadable(events)(
            () =>
              isComplete ? (
                <SimulationSectionComplete />
              ) : isReplaced ? (
                <SimulationSectionReplaced />
              ) : (
                <SimulationSectionSkeleton />
              ),
            // Error can only occur on simulation, not history currently
            // TODO: have a better way to do this error rather than hardcoding
            () => (
              <SimulationSectionError
                type={
                  wallet.type === IWalletType.Safe &&
                  (wallet.chainId === ChainId.ZkSync ||
                    wallet.chainId === ChainId.Scroll)
                    ? 'unsupported_safe'
                    : 'transaction'
                }
              />
            ),
            (events) => {
              const {
                tokenTransfers,
                nftTransfers,
                tokenApprovals,
                nftApprovals,
                safeAddedOwners,
                safeRemovedOwners,
                safeChangedThreshold,
                error,
                internalError,
              } = events;
              const recipientAddress = events.recipientAddress;
              const txError = error || internalError;

              if (isComplete && type === 'proposal') {
                return <SimulationSectionComplete />;
              } else if (isReplaced) {
                return <SimulationSectionReplaced />;
              } else if (isRejection) {
                return <RejectionAction nonce={rejectionNonce} />;
              } else if (txError) {
                return (
                  <FailureAction
                    message={txError}
                    isSimulation={type === 'proposal'}
                  />
                );
              } else if (
                isEmpty(tokenApprovals) &&
                isEmpty(tokenTransfers) &&
                isEmpty(nftApprovals) &&
                isEmpty(nftTransfers) &&
                isEmpty(safeAddedOwners) &&
                isEmpty(safeRemovedOwners) &&
                isEmpty(safeChangedThreshold)
              ) {
                return <SimulationSectionEmpty />;
              } else {
                return (
                  <View className='flex flex-col py-2'>
                    <View className='flex flex-col space-y-4'>
                      {tokenTransfers.map((event, index) => (
                        <TokenTransferItem
                          key={index}
                          address={wallet.address}
                          onCopy={copyTokenAddress}
                          event={event}
                        />
                      ))}
                      {nftTransfers.map((event, index) => (
                        <NFTTransferItem
                          key={index}
                          address={wallet.address}
                          blockchain={wallet.blockchain}
                          event={event}
                        />
                      ))}
                      {tokenApprovals.map((event, index) => (
                        <TokenApprovalItem
                          key={index}
                          address={wallet.address}
                          event={event}
                          onCopy={copyApproval}
                        />
                      ))}
                      {nftApprovals.map((event, index) => (
                        <NFTApprovalItem
                          key={index}
                          address={wallet.address}
                          blockchain={wallet.blockchain}
                          event={event}
                          onCopy={copyApproval}
                        />
                      ))}
                      {safeRemovedOwners.map((event, index) => (
                        <RemoveSafeOwnerItem
                          key={index}
                          address={wallet.address}
                          event={event}
                        />
                      ))}
                      {safeAddedOwners.map((event, index) => (
                        <AddSafeOwnerItem
                          key={index}
                          address={wallet.address}
                          event={event}
                        />
                      ))}
                      {safeChangedThreshold.map((event, index) => (
                        <SafeChangeThresholdItem
                          key={index}
                          address={wallet.address}
                          event={event}
                        />
                      ))}
                    </View>
                    {recipientAddress && (
                      <TransferRecipient
                        transferRecipient={recipientAddress}
                        contacts={contacts}
                        wallets={wallets}
                        chainId={chainId}
                        onCopy={copyAddress}
                      />
                    )}
                  </View>
                );
              }
            },
          )}
      </View>
    </InfoCard>
  );
});

export const WalletMessageChangeCard = styled(function (props: {
  wallet: IWallet;
  chainId: ChainId;
  events: Loadable<IMessageEvents>;
  style?: StyleProp<ViewStyle>;
}) {
  const { wallet, chainId, events, style } = props;
  const { copy: copyApproval } = useCopy('Copied approval address!');

  const [collapsed, setCollapsed] = useState(false);

  const canCollapse = true;

  return (
    <InfoCard style={style} borderColor={colors.approve}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={!canCollapse ? undefined : () => setCollapsed(!collapsed)}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={faCoinFront}
                size={adjust(14, 2)}
                color={colors.textPrimary}
              />
              <Text className='text-text-primary text-sm font-medium'>
                {'Wallet Changes'}
              </Text>
            </View>
            {canCollapse ? (
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronDown}
                size={adjust(12, 2)}
                color={colors.textPrimary}
              />
            ) : (
              <View />
            )}
          </View>
        </BaseButton>
        {!collapsed &&
          onLoadable(events)(
            // We never show this loading state
            () => null,
            // Error can only occur on simulation, not history currently
            () => <SimulationSectionError type='message' />,
            (events) => {
              const {
                tokenTransfers,
                nftTransfers,
                tokenApprovals,
                nftApprovals,
              } = events;
              return (
                <View className='flex flex-col py-2'>
                  <View className='flex flex-col space-y-4'>
                    {tokenTransfers.map((event, index) => (
                      <MessageTokenTransferItem
                        wallet={wallet}
                        key={index}
                        event={event}
                      />
                    ))}
                    {nftTransfers.map((event, index) => (
                      <MessageNFTTransferItem
                        wallet={wallet}
                        key={index}
                        event={event}
                      />
                    ))}
                    {tokenApprovals.map((event, index) => (
                      <MessageTokenApprovalItem
                        wallet={wallet}
                        key={index}
                        event={event}
                        onCopy={copyApproval}
                      />
                    ))}
                    {nftApprovals.map((event, index) => (
                      <MessageNFTApprovalItem
                        wallet={wallet}
                        key={index}
                        event={event}
                      />
                    ))}
                  </View>
                </View>
              );
            },
          )}
      </View>
    </InfoCard>
  );
});

export const BridgeProgressCard = styled(function (props: {
  wallet: IWallet;
  chainId: number;
  type: 'history' | 'proposal';
  failed: boolean;
  bridgeData: BridgeData;
  contacts?: IContact[];
  wallets?: IWallet[];
  style?: StyleProp<ViewStyle>;
}) {
  const {
    wallet,
    chainId,
    type,
    failed,
    bridgeData,
    contacts,
    wallets,
    style,
  } = props;
  const { copy: copyAddress } = useCopy('Copied destination address!');
  const { copy: copyTokenAddress } = useCopy('Copied token address!');

  const [collapsed, setCollapsed] = useState(false);

  const canCollapse = type !== 'history';
  const isBridgeFailed =
    bridgeData.bridgeStatus === IBridgeStatus.Refunded ||
    bridgeData.bridgeStatus === IBridgeStatus.Refunding ||
    bridgeData.bridgeStatus === IBridgeStatus.Failed;

  // TODO: some bridge token edge cases/failures the ui for token might be inaccurate
  return (
    <InfoCard style={style} borderColor={colors.swapLight}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={canCollapse ? () => setCollapsed(!collapsed) : undefined}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={faBridgeWater}
                size={adjust(14, 2)}
                color={colors.textPrimary}
              />
              <Text className='text-text-primary text-sm font-medium'>
                {canCollapse ? 'Bridge Status' : 'Bridged Assets'}
              </Text>
            </View>
            {canCollapse && (
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronDown}
                size={adjust(12, 2)}
                color={colors.textPrimary}
              />
            )}
          </View>
        </BaseButton>
        {!collapsed && (canCollapse || !isBridgeFailed) && (
          <View className='flex flex-col space-y-2'>
            {canCollapse && !failed && (
              <TransactionBridgeTracker bridgeData={bridgeData} />
            )}
            {!isBridgeFailed && (
              <TransactionBridge
                bridgeData={bridgeData}
                wallet={wallet}
                contacts={contacts}
                wallets={wallets}
                onCopyAddress={copyAddress}
                onCopyToken={copyTokenAddress}
              />
            )}
          </View>
        )}
      </View>
    </InfoCard>
  );
});

export const MessageCard = styled(function (props: {
  message: string;
  messageType: IMessageType;
  type: 'history' | 'proposal';
  style?: StyleProp<ViewStyle>;
}) {
  const { message, messageType, type, style } = props;

  const [collapsed, setCollapsed] = useState(false);

  const canCollapse = type !== 'history';

  return (
    <InfoCard style={style} borderColor={colors.soulbound}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={canCollapse ? () => setCollapsed(!collapsed) : undefined}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={faMessageCode}
                size={adjust(14, 2)}
                color={colors.textPrimary}
              />
              <Text className='text-text-primary text-sm font-medium'>
                {'Message'}
              </Text>
            </View>
            {canCollapse && (
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronDown}
                size={adjust(12, 2)}
                color={colors.textPrimary}
              />
            )}
          </View>
        </BaseButton>
        {!collapsed && (
          <View className='flex flex-col space-y-3'>
            {messageType === IMessageType.Eip712 ? (
              <TypedMessage message={JSON.parse(message).message} />
            ) : (
              <Text className='text-text-secondary text-xs font-light'>
                {message}
              </Text>
            )}
          </View>
        )}
      </View>
    </InfoCard>
  );
});

export const SafeInfoCard = styled(function (props: {
  safeInfo: SafeInfoResponse;
  signer?: ISignerWallet;
  // TODO: make this a better data structure
  executor?: ISignerWallet | null;
  executionState?: 'valid' | 'loading' | 'invalid';
  validSignatures: string[];
  nonce?: number;
  state?: SafeTxState;
  onSignerPress: VoidFunction;
  onExecutorPress?: VoidFunction;
  onEditNonce?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    safeInfo,
    signer,
    executor,
    executionState,
    validSignatures,
    nonce,
    state,
    onSignerPress,
    onExecutorPress,
    onEditNonce,
    style,
  } = props;

  const [collapsed, setCollapsed] = useState(false);

  return (
    <InfoCard style={style} borderColor={colors.safe}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={() => setCollapsed(!collapsed)}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <View className='-ml-1'>
                <Image source={SafeLogo} style={withSize(adjust(18, 2))} />
              </View>
              <Text className='text-text-primary text-sm font-medium'>
                {'Safe Info'}
              </Text>
            </View>
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronDown}
              size={adjust(12, 2)}
              color={colors.textPrimary}
            />
          </View>
        </BaseButton>
        {!collapsed && (
          <View className='flex flex-col space-y-3'>
            {!isNil(nonce) && state && onEditNonce && (
              <SafeNonceInfoItem
                safeInfo={safeInfo}
                safeNonce={nonce}
                proposalState={state}
                onEditNonce={onEditNonce}
              />
            )}
            <SafeThresholdInfoItem
              obtained={validSignatures.length}
              required={safeInfo.threshold}
            />
            <SafeSignatureInfoItem
              signer={signer}
              safeInfo={safeInfo}
              signatures={validSignatures}
              onPress={onSignerPress}
            />
            {onExecutorPress && executionState !== 'invalid' && (
              <ExecutorInfoItem
                executor={executor}
                loading={executionState === 'loading'}
                onPress={onExecutorPress}
              />
            )}
          </View>
        )}
      </View>
    </InfoCard>
  );
});

export const UndeployedSafeInfoCard = styled(function (props: {
  threshold: number;
  signers: SafeSignerInfo[];
  executor?: ISignerWallet | null;
  executionState?: 'valid' | 'loading' | 'invalid';
  onExecutorPress?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    threshold,
    signers,
    executor,
    executionState,
    onExecutorPress,
    style,
  } = props;
  const { copy } = useCopy('Copied signer address!');

  const [collapsed, setCollapsed] = useState(false);

  return (
    <InfoCard style={style} borderColor={colors.safe}>
      <View className='flex flex-col space-y-4'>
        <BaseButton
          onPress={() => setCollapsed(!collapsed)}
          animationEnabled={false}
          rippleEnabled={false}
        >
          <View className='flex flex-row items-center justify-between'>
            <View className='flex flex-row items-center space-x-2'>
              <View className='-ml-1'>
                <Image source={SafeLogo} style={withSize(adjust(18, 2))} />
              </View>
              <Text className='text-text-primary text-sm font-medium'>
                {'Safe Info'}
              </Text>
            </View>
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronDown}
              size={adjust(12, 2)}
              color={colors.textPrimary}
            />
          </View>
        </BaseButton>
        {!collapsed && (
          <View className='flex flex-col space-y-3'>
            {signers.map((signer, index) => (
              <SafeSignerInfoItem
                signer={signer}
                key={signer.address}
                index={index + 1}
                onCopy={copy}
              />
            ))}
            <SafeThresholdInfoItem
              obtained={threshold}
              required={signers.length}
              hideStatus={true}
            />
            {onExecutorPress && (
              <ExecutorInfoItem
                executor={executor}
                loading={executionState === 'loading'}
                onPress={onExecutorPress}
              />
            )}
          </View>
        )}
      </View>
    </InfoCard>
  );
});

export const InfoCard = styled(function (props: {
  borderColor: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { borderColor, children, style } = props;
  return (
    <View style={style}>
      <View
        className='bg-card flex flex-col rounded-2xl border-l-4 px-4 py-3'
        style={{ borderColor }}
      >
        {children}
      </View>
    </View>
  );
});
