import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowDown,
  faArrowDownToLine,
  faBadgeCheck,
  faBagShopping,
  faBan,
  faBox,
  faBoxOpen,
  faBridgeWater,
  faCode,
  faCodeSimple,
  faExclamationCircle,
  faFire,
  faGear,
  faGlobe,
  faHourglassStart,
  faMemo,
  faMessageCode,
  faPaperPlane,
  faQuestionCircle,
  faScaleBalanced,
  faShuffle,
  faSignature,
  faStamp,
  faStarChristmas,
  faStore,
  faTimes,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { isArray, partition } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../common/format/address';
import { formatCrypto } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { BridgeData, Tuple } from '../../common/types';
import {
  firstOf,
  opacity,
  tuple,
  withHttps,
} from '../../common/utils/functions';
import { parseOrigin } from '../../common/utils/origin';
import { adjust, withSize } from '../../common/utils/style';
import { ActivityIndicator } from '../../components/activity-indicator';
import { ChainAvatar } from '../../components/avatar/chain-avatar';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { NFTAvatar } from '../../components/avatar/nft-avatar';
import { WalletAvatar } from '../../components/avatar/wallet-avatar';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { ListItem } from '../../components/list/list-item';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { WalletIcon } from '../../components/wallet-icon';
import { colors } from '../../design/constants';
import { ChainId, getChainInfo } from '../../features/chain';
import { isRejectionSafeTransactionProposal } from '../../features/proposal/nonce';
import {
  onTransactionProposal,
  resolveExternalTransactionProposal,
  resolveMessageProposal,
} from '../../features/proposal/utils';
import {
  IBridgeStatus,
  ILimitOrderType,
  IMessageProposal,
  INftCollectionMetadata,
  INftMetadata,
  ISafeTransactionProposal,
  ISwapType,
  ITokenMetadata,
  ITransaction,
  ITransactionLimitOrderMetadata,
  ITransactionMetaType,
  ITransactionNftApprovalEvent,
  ITransactionNftTransferEvent,
  ITransactionOperationType,
  ITransactionProposal,
  ITransactionSafeAddedOwnerEvent,
  ITransactionSafeRemovedOwnerEvent,
  ITransactionStatus,
  ITransactionTokenApprovalEvent,
  ITransactionTokenTransferEvent,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { AssetTextData } from './types';
import {
  assetChangeFromNftApproval,
  assetChangeFromNftTransfer,
  assetChangeFromTokenApproval,
  assetChangeFromTokenTransfer,
  contractMap,
} from './utils';

export function TransactionListItem(props: {
  wallet: IWallet;
  externalAddress?: string;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, externalAddress, transaction, onPress } = props;

  const metadata = transaction.proposal
    ? onTransactionProposal(transaction.proposal)(
        (tx) => tx.metadata,
        (tx) => tx.metadata,
        (tx) => tx.metadata,
        (tx) => tx.metadata,
      )
    : [];

  const [receiveTokens, sendTokens] = partition(
    transaction.transactionEvents.tokenTransfers,
    (transfer) => transfer.to === wallet.address,
  );
  const [receiveNfts, sendNfts] = partition(
    transaction.transactionEvents.nftTransfers,
    (transfer) => transfer.to === wallet.address,
  );

  const isReceiveToken = receiveTokens.length > 0;
  const isSendTokens = sendTokens.length > 0;

  const isReceiveNft = receiveNfts.length > 0;
  const isSendNft = sendNfts.length > 0;

  const isApproveToken =
    transaction.transactionEvents.tokenApprovals.length > 0;
  const isApproveNft = transaction.transactionEvents.nftApprovals.length > 0;

  const bridgeMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.Bridge,
  )?.bridge;
  const isBridge =
    sendTokens.length > 0 &&
    (!!transaction.proposal?.ethKey?.bridgeData ||
      !!transaction.proposal?.svmKey?.bridgeData ||
      !!bridgeMetadata);

  const limitOrderMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.LimitOrder,
  )?.limitOrder;
  const isLimitOrder = !!limitOrderMetadata && sendTokens.length > 0;
  const isLimitOrderExecute =
    !!externalAddress &&
    transaction.from === externalAddress &&
    receiveTokens.length > 0;

  const isRejection =
    !!transaction.proposal?.safe &&
    isRejectionSafeTransactionProposal(transaction.proposal?.safe);

  const hasSafeRemovedOwners =
    transaction.transactionEvents.safeRemovedOwners.length > 0;
  const hasSafeAddedOwners =
    transaction.transactionEvents.safeAddedOwners.length > 0;

  return (
    firstOf(
      tuple(
        !transaction.isSuccess &&
          !!transaction.proposal &&
          !!metadata &&
          wallet.type !== IWalletType.Safe,
        () => (
          <PendingTransactionListItem
            proposal={transaction.proposal!}
            onPress={onPress}
          />
        ),
      ),
      tuple(isBridge, () => (
        <BridgeListItem
          wallet={wallet}
          fromTokenTransfer={sendTokens[0]!}
          bridgeData={
            bridgeMetadata
              ? {
                  legacy: false,
                  bridgeStatus: IBridgeStatus.Complete,
                  bridgeData: bridgeMetadata,
                }
              : {
                  legacy: true,
                  bridgeStatus: IBridgeStatus.Complete,
                  bridgeData:
                    transaction.proposal!.ethKey?.bridgeData! ||
                    transaction.proposal!.svmKey?.bridgeData!,
                }
          }
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isLimitOrder, () => (
        <LimitOrderListItem
          wallet={wallet}
          transfer={sendTokens[0]!}
          limitOrder={limitOrderMetadata!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isLimitOrderExecute, () => (
        <LimitOrderExecuteListItem
          wallet={wallet}
          transfer={receiveTokens[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // token + nft trades
      tuple(isReceiveNft && isSendTokens, () => (
        <BuyNftListItem
          wallet={wallet}
          tokenTransfer={sendTokens[0]!}
          nftTransfer={receiveNfts[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isSendNft && isReceiveToken, () => (
        <SellNftListItem
          wallet={wallet}
          tokenTransfer={receiveTokens[0]!}
          nftTransfer={sendNfts[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isReceiveNft && isSendNft, () => (
        <TradeNftListItem
          wallet={wallet}
          fromNftTransfer={sendNfts[0]!}
          toNftTransfer={receiveNfts[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // send and receive nfts
      tuple(isReceiveNft, () => (
        <ReceiveNftListItem
          wallet={wallet}
          transfer={receiveNfts[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isSendNft, () => (
        <SendNftListItem
          wallet={wallet}
          transfer={sendNfts[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // token swaps
      tuple(isSendTokens && isReceiveToken, () => (
        <SwapListItem
          wallet={wallet}
          fromTokenTransfer={sendTokens[0]!}
          toTokenTransfer={receiveTokens[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // Send and receive tokens
      tuple(isSendTokens, () => (
        <SendTokenListItem
          wallet={wallet}
          transfer={sendTokens[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isReceiveToken, () => (
        <ReceiveTokenListItem
          wallet={wallet}
          transfer={receiveTokens[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // Approvals
      tuple(isApproveToken, () => (
        <ApproveTokenListItem
          wallet={wallet}
          approval={transaction.transactionEvents.tokenApprovals[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(isApproveNft, () => (
        <ApproveNftListItem
          wallet={wallet}
          approval={transaction.transactionEvents.nftApprovals[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // Safe specific items
      tuple(isRejection, () => (
        <RejectListItem
          wallet={wallet}
          proposal={transaction.proposal!.safe!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      // Safe specific items
      tuple(hasSafeRemovedOwners && hasSafeAddedOwners, () => (
        <SafeOwnerModifiedListItem
          wallet={wallet}
          addedOwner={transaction.transactionEvents.safeAddedOwners[0]!}
          removedOwner={transaction.transactionEvents.safeRemovedOwners[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(hasSafeRemovedOwners, () => (
        <RemovedOwnerListItem
          wallet={wallet}
          removedOwner={transaction.transactionEvents.safeRemovedOwners[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
      tuple(hasSafeAddedOwners, () => (
        <AddedOwnerListItem
          wallet={wallet}
          addedOwner={transaction.transactionEvents.safeAddedOwners[0]!}
          transaction={transaction}
          onPress={onPress}
        />
      )),
    ) ?? (
      <ContractListItem
        wallet={wallet}
        transaction={transaction}
        onPress={onPress}
      />
    )
  );
}

// Receive

function ReceiveTokenListItem(props: {
  wallet: IWallet;
  transfer: ITransactionTokenTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transfer, transaction, onPress } = props;

  const assetChange = assetChangeFromTokenTransfer(wallet, transfer);
  const isMint = transaction.type === ITransactionOperationType.Mint;
  // const isBurn = transaction.proposal?.svmKey?.metadata?.find(
  //   (data) =>
  //     data.type === ITransactionMetaType.TokenBurn ||
  //     data.type === ITransactionMetaType.NftBurn,
  // );

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isMint ? faStarChristmas : faArrowDownToLine}
          color={isMint ? colors.primary : colors.receive}
          text={isMint ? 'Mint' : 'Receive'}
        />
      }
      avatar={
        <CryptoHistoryAvatar
          token={transfer.tokenMetadata}
          chainId={transaction.chainId}
        />
      }
      title={transfer.tokenMetadata.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function ReceiveNftListItem(props: {
  wallet: IWallet;
  transfer: ITransactionNftTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transfer, transaction, onPress } = props;

  const assetChange = assetChangeFromNftTransfer(wallet, transfer);
  const isMint = transaction.type === ITransactionOperationType.Mint;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isMint ? faStarChristmas : faArrowDown}
          color={isMint ? colors.mint : colors.receive}
          text={isMint ? 'Mint' : 'Receive'}
        />
      }
      avatar={
        <NftHistoryAvatar
          nft={transfer.nftMetadata}
          collection={transfer.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      title={transfer.nftMetadata.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

// Send

function SendTokenListItem(props: {
  wallet: IWallet;
  transfer: ITransactionTokenTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transfer, transaction, onPress } = props;

  const assetChange = assetChangeFromTokenTransfer(wallet, transfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faPaperPlane}
          iconSizeAdjustment={-2}
          color={colors.send}
          text={'Send'}
        />
      }
      avatar={
        <CryptoHistoryAvatar
          token={transfer.tokenMetadata}
          chainId={transaction.chainId}
        />
      }
      title={transfer.tokenMetadata.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function SendNftListItem(props: {
  wallet: IWallet;
  transfer: ITransactionNftTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transfer, transaction, onPress } = props;

  const assetChange = assetChangeFromNftTransfer(wallet, transfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faPaperPlane}
          iconSizeAdjustment={-2}
          color={colors.send}
          text={'Send'}
        />
      }
      avatar={
        <NftHistoryAvatar
          nft={transfer.nftMetadata}
          collection={transfer.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      title={transfer.nftMetadata.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

// Swaps

function TradeNftListItem(props: {
  wallet: IWallet;
  fromNftTransfer: ITransactionNftTransferEvent;
  toNftTransfer: ITransactionNftTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, fromNftTransfer, toNftTransfer, transaction, onPress } =
    props;

  const fromAssetChange = assetChangeFromNftTransfer(wallet, fromNftTransfer);
  const toAssetChange = assetChangeFromNftTransfer(wallet, toNftTransfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem icon={faStore} color={colors.nftTrade} text={'Trade'} />
      }
      title={toNftTransfer.nftMetadata.name}
      avatar={
        <NftHistoryAvatar
          nft={toNftTransfer.nftMetadata}
          collection={toNftTransfer.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      assetChange={[fromAssetChange, toAssetChange]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function BuyNftListItem(props: {
  wallet: IWallet;
  tokenTransfer: ITransactionTokenTransferEvent;
  nftTransfer: ITransactionNftTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, tokenTransfer, nftTransfer, transaction, onPress } = props;

  const fromAssetChange = assetChangeFromTokenTransfer(wallet, tokenTransfer);
  const toAssetChange = assetChangeFromNftTransfer(wallet, nftTransfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem icon={faBagShopping} color={colors.buyNft} text={'Buy'} />
      }
      title={nftTransfer.nftMetadata.name}
      avatar={
        <NftHistoryAvatar
          nft={nftTransfer.nftMetadata}
          collection={nftTransfer.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      assetChange={[fromAssetChange, toAssetChange]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function SellNftListItem(props: {
  wallet: IWallet;
  tokenTransfer: ITransactionTokenTransferEvent;
  nftTransfer: ITransactionNftTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, tokenTransfer, nftTransfer, transaction, onPress } = props;

  const toAssetChange = assetChangeFromTokenTransfer(wallet, tokenTransfer);
  const fromAssetChange = assetChangeFromNftTransfer(wallet, nftTransfer);

  return (
    <BaseTransactionListItem
      action={<ActionItem icon={faStamp} color={colors.sellNft} text='Sell' />}
      title={nftTransfer.nftMetadata.name}
      avatar={
        <NftHistoryAvatar
          nft={nftTransfer.nftMetadata}
          collection={nftTransfer.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      assetChange={[fromAssetChange, toAssetChange]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function SwapListItem(props: {
  wallet: IWallet;
  fromTokenTransfer: ITransactionTokenTransferEvent;
  toTokenTransfer: ITransactionTokenTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, fromTokenTransfer, toTokenTransfer, transaction, onPress } =
    props;

  const fromAssetChange = assetChangeFromTokenTransfer(
    wallet,
    fromTokenTransfer,
  );
  const toAssetChange = assetChangeFromTokenTransfer(wallet, toTokenTransfer);
  const chainInfo = getChainInfo(transaction.chainId);
  const isUnwrap =
    fromTokenTransfer.tokenMetadata.address ===
      chainInfo.wrappedToken.address &&
    toTokenTransfer.tokenMetadata.isNativeToken;
  const isWrap =
    toTokenTransfer.tokenMetadata.address === chainInfo.wrappedToken.address &&
    fromTokenTransfer.tokenMetadata.isNativeToken;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isWrap ? faBox : isUnwrap ? faBoxOpen : faShuffle}
          color={colors.swapLight}
          iconSizeAdjustment={-1}
          text={isWrap ? 'Wrap' : isUnwrap ? 'Unwrap' : 'Swap'}
        />
      }
      title={toTokenTransfer.tokenMetadata.name}
      avatar={
        <SwapHistoryAvatar
          fromToken={fromTokenTransfer.tokenMetadata}
          toToken={toTokenTransfer.tokenMetadata}
          toChainId={transaction.chainId}
        />
      }
      assetChange={[fromAssetChange, toAssetChange]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function BridgeListItem(props: {
  wallet: IWallet;
  fromTokenTransfer: ITransactionTokenTransferEvent;
  bridgeData: BridgeData;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, fromTokenTransfer, bridgeData, transaction, onPress } = props;

  return bridgeData.legacy ? (
    <BaseTransactionListItem
      action={
        <ActionItem icon={faBridgeWater} color={colors.bridge} text='Bridge' />
      }
      avatar={
        <SwapHistoryAvatar
          fromToken={fromTokenTransfer.tokenMetadata}
          toToken={bridgeData.bridgeData.expectedTokenMetadata}
          fromChainId={transaction.chainId}
          toChainId={bridgeData.bridgeData.chainId}
        />
      }
      title={bridgeData.bridgeData.expectedTokenMetadata.name}
      assetChange={[
        {
          text: (
            <WalletInline
              address={bridgeData.bridgeData.expectedRecipientAddress}
            />
          ),
          color: colors.textSecondary,
        },
        {
          text: `${formatCrypto(
            bridgeData.bridgeData.expectedTokenAmount,
            bridgeData.bridgeData.expectedTokenMetadata.decimals,
            NumberType.TokenTx,
          )} ${bridgeData.bridgeData.expectedTokenMetadata.symbol}`,
          color: colors.textPrimary,
        },
      ]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  ) : (
    <BaseTransactionListItem
      action={
        <ActionItem icon={faBridgeWater} color={colors.bridge} text='Bridge' />
      }
      avatar={
        <SwapHistoryAvatar
          fromToken={fromTokenTransfer.tokenMetadata}
          toToken={bridgeData.bridgeData.outTokenMetadata}
          fromChainId={transaction.chainId}
          toChainId={bridgeData.bridgeData.toChainId}
        />
      }
      title={bridgeData.bridgeData.outTokenMetadata.name}
      assetChange={[
        {
          text: (
            <WalletInline address={bridgeData.bridgeData.recipientAddress} />
          ),
          color: colors.textSecondary,
        },
        {
          text: `${formatCrypto(
            bridgeData.bridgeData.outTokenAmount,
            bridgeData.bridgeData.outTokenMetadata.decimals,
            NumberType.TokenTx,
          )} ${bridgeData.bridgeData.outTokenMetadata.symbol}`,
          color: colors.textPrimary,
        },
      ]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function LimitOrderListItem(props: {
  wallet: IWallet;
  limitOrder: ITransactionLimitOrderMetadata;
  transfer: ITransactionTokenTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, limitOrder, transfer, transaction, onPress } = props;

  const primary =
    limitOrder.orderType === ILimitOrderType.Buy
      ? limitOrder.toTokenMetadata
      : limitOrder.fromTokenMetadata;
  const assetChange = assetChangeFromTokenTransfer(wallet, transfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faScaleBalanced}
          color={colors.swapLight}
          text={
            limitOrder.orderType === ILimitOrderType.Buy
              ? 'Limit Buy'
              : 'Limit Sell'
          }
        />
      }
      avatar={
        <CryptoHistoryAvatar token={primary} chainId={transaction.chainId} />
      }
      title={primary.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function LimitOrderExecuteListItem(props: {
  wallet: IWallet;
  transfer: ITransactionTokenTransferEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transfer, transaction, onPress } = props;

  const assetChange = assetChangeFromTokenTransfer(wallet, transfer);

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faScaleBalanced}
          color={colors.swapLight}
          text={'Limit Executed'}
        />
      }
      avatar={
        <CryptoHistoryAvatar
          token={transfer.tokenMetadata}
          chainId={transaction.chainId}
        />
      }
      title={transfer.tokenMetadata.name}
      assetChange={assetChange}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function ApproveTokenListItem(props: {
  wallet: IWallet;
  approval: ITransactionTokenApprovalEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, approval, transaction, onPress } = props;

  const assetChange = assetChangeFromTokenApproval(wallet, approval);
  const isRevoke = BigInt(approval.quantity) === 0n;
  // TODO: resolve known addresses here

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isRevoke ? faBan : faBadgeCheck}
          color={assetChange.color}
          text={isRevoke ? 'Revoke' : 'Approve'}
        />
      }
      avatar={
        <CryptoHistoryAvatar
          token={approval.tokenMetadata}
          chainId={transaction.chainId}
        />
      }
      title={approval.tokenMetadata.name}
      assetChange={[
        {
          text: (
            <WalletInline
              address={approval.approved}
              isContract={true}
              name={contractMap[approval.approved]?.name}
            />
          ),
          color: colors.textSecondary,
        },
        assetChange,
      ]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function ApproveNftListItem(props: {
  wallet: IWallet;
  approval: ITransactionNftApprovalEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, approval, transaction, onPress } = props;

  const assetChange = assetChangeFromNftApproval(wallet, approval);
  const isRevoke = !!approval.quantity && BigInt(approval.quantity) === 0n;
  // TODO: resolve known addresses here

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isRevoke ? faBan : faBadgeCheck}
          color={assetChange.color}
          text={isRevoke ? 'Revoke' : 'Approve'}
        />
      }
      avatar={
        <NftHistoryAvatar
          nft={approval.nftMetadata ?? undefined}
          collection={approval.collectionMetadata}
          chainId={transaction.chainId}
        />
      }
      title={approval.nftMetadata?.name || approval.collectionMetadata.name}
      assetChange={[
        {
          text: (
            <WalletInline
              address={approval.approved}
              isContract={true}
              name={contractMap[approval.approved]?.name}
            />
          ),
          color: colors.textSecondary,
        },
        assetChange,
      ]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function RejectListItem(props: {
  wallet: IWallet;
  proposal: ISafeTransactionProposal;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, proposal, transaction, onPress } = props;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem icon={faTimes} color={colors.failure} text='Reject' />
      }
      avatar={<WalletHistoryAvatar wallet={wallet} />}
      title={wallet.name}
      onPress={onPress}
      assetChange={{
        text: `Nonce ${proposal.safeNonce!}`,
        color: colors.textSecondary,
      }}
      isFailed={!transaction.isSuccess}
    />
  );
}

function AddedOwnerListItem(props: {
  wallet: IWallet;
  addedOwner: ITransactionSafeAddedOwnerEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, addedOwner, transaction, onPress } = props;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faGear}
          color={colors.safeOwnerAdd}
          text='Add Signers'
        />
      }
      avatar={<WalletHistoryAvatar wallet={wallet} />}
      title={wallet.name}
      assetChange={{
        text: (
          <SignerWalletInline
            added={true}
            address={addedOwner.owner}
            size={'sm'}
          />
        ),
        color: colors.success,
      }}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function RemovedOwnerListItem(props: {
  wallet: IWallet;
  removedOwner: ITransactionSafeRemovedOwnerEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, removedOwner, transaction, onPress } = props;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faGear}
          color={colors.safeOwnerRemove}
          text='Remove Signers'
        />
      }
      avatar={<WalletHistoryAvatar wallet={wallet} />}
      title={wallet.name}
      assetChange={{
        text: (
          <SignerWalletInline
            added={false}
            address={removedOwner.owner}
            size={'sm'}
          />
        ),
        color: colors.failure,
      }}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function SafeOwnerModifiedListItem(props: {
  wallet: IWallet;
  addedOwner: ITransactionSafeAddedOwnerEvent;
  removedOwner: ITransactionSafeRemovedOwnerEvent;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, addedOwner, removedOwner, transaction, onPress } = props;

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faGear}
          color={colors.safeOwnerModify}
          text='Modify Signers'
        />
      }
      avatar={<WalletHistoryAvatar wallet={wallet} />}
      title={wallet.name}
      assetChange={[
        {
          text: (
            <SignerWalletInline
              added={false}
              address={removedOwner.owner}
              size={'xs'}
            />
          ),
          color: colors.failure,
        },
        {
          text: (
            <SignerWalletInline
              added={true}
              address={addedOwner.owner}
              size={'sm'}
            />
          ),
          color: colors.success,
        },
      ]}
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

function ContractListItem(props: {
  wallet: IWallet;
  transaction: ITransaction;
  onPress: VoidFunction;
}) {
  const { wallet, transaction, onPress } = props;

  const size = adjust(36);

  const origin = parseOrigin(
    transaction.proposal?.safe ||
      transaction.proposal?.ethKey ||
      transaction.proposal?.svmKey,
  );

  const root = origin ? (
    <OriginImage uri={origin.favIconUrl} size={size} />
  ) : (
    <View
      className='bg-card items-center justify-center rounded-full'
      style={withSize(size)}
    >
      <FontAwesomeIcon
        icon={faCode}
        color={colors.textPrimary}
        size={adjust(20)}
      />
    </View>
  );

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={!transaction.isSuccess ? faExclamationCircle : faCodeSimple}
          color={!transaction.isSuccess ? colors.failure : colors.execute}
          text='Execute'
        />
      }
      avatar={<HistoryAvatar root={root} chainId={transaction.chainId} />}
      title={
        origin?.url
          ? new URL(withHttps(origin.url)).hostname
          : 'Contract Interaction'
      }
      onPress={onPress}
      isFailed={!transaction.isSuccess}
    />
  );
}

export function SignedMessageListItem(props: {
  message: IMessageProposal;
  onPress: VoidFunction;
}) {
  const { message, onPress } = props;

  const data = resolveMessageProposal(message);
  const size = adjust(36);

  const root = data.originImageURL ? (
    <OriginImage uri={data.originImageURL} size={size} />
  ) : (
    <View
      className='bg-card items-center justify-center rounded-full'
      style={withSize(size)}
    >
      <FontAwesomeIcon
        icon={faMessageCode}
        color={colors.textPrimary}
        size={adjust(20)}
      />
    </View>
  );

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={faSignature}
          color={colors.messageSign}
          text='Sign Message'
        />
      }
      avatar={<HistoryAvatar root={root} />}
      title={
        data.originURL
          ? new URL(withHttps(data.originURL)).hostname
          : 'Message Request'
      }
      onPress={onPress}
    />
  );
}

export function PendingTransactionListItem(props: {
  proposal: ITransactionProposal;
  onPress: VoidFunction;
}) {
  const { proposal, onPress } = props;

  const resolved = resolveExternalTransactionProposal(proposal);
  const size = adjust(36);
  const origin = parseOrigin(resolved);
  const originName = origin?.url
    ? new URL(withHttps(origin.url)).hostname
    : undefined;

  const isDropped = resolved.status === ITransactionStatus.Dropped;
  const isFailed = resolved.status === ITransactionStatus.Failed;
  const isPending = resolved.status === ITransactionStatus.Pending;
  const metadata = resolved.metadata;
  const bridgeMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.Bridge,
  )?.bridge;
  const swapMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.Swap,
  )?.swap;
  const limitOrderMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.LimitOrder,
  )?.limitOrder;
  const tokenApprovalMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.TokenApproval,
  )?.tokenApproval;
  const nftApprovalMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.NftApproval,
  )?.nftApproval;
  const tokenTransferMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.TokenTransfer,
  )?.tokenTransfer;
  const nftTransferMetadata = metadata?.find(
    (data) => data.type === ITransactionMetaType.NftTransfer,
  )?.nftTransfer;
  const tokenBurnMetadata =
    metadata?.filter((data) => data.type === ITransactionMetaType.TokenBurn) ??
    [];
  const nftBurnMetadata =
    metadata?.filter((data) => data.type === ITransactionMetaType.NftBurn) ??
    [];

  // TODO: add both chain ids here? (like swap, largest from and bridge asset)
  if (bridgeMetadata) {
    return (
      <BaseTransactionListItem
        action={
          <ActionItem
            icon={faBridgeWater}
            color={colors.bridge}
            text='Bridge'
          />
        }
        avatar={
          <SwapHistoryAvatar
            fromToken={bridgeMetadata.inTokenMetadata}
            toToken={bridgeMetadata.outTokenMetadata}
            fromChainId={bridgeMetadata.fromChainId}
            toChainId={bridgeMetadata.toChainId}
          />
        }
        title={bridgeMetadata.outTokenMetadata.name}
        isBridging={!isDropped && !isFailed}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  if (swapMetadata) {
    return (
      <BaseTransactionListItem
        action={
          <ActionItem
            icon={
              swapMetadata!.swapType === ISwapType.Buy ||
              swapMetadata!.swapType === ISwapType.Sell
                ? faStore
                : faShuffle
            }
            color={
              swapMetadata!.swapType === ISwapType.Buy
                ? colors.success
                : swapMetadata!.swapType === ISwapType.Sell
                ? colors.failure
                : colors.swapLight
            }
            text={
              swapMetadata!.swapType === ISwapType.Buy
                ? 'Buy'
                : swapMetadata!.swapType === ISwapType.Sell
                ? 'Sell'
                : 'Swap'
            }
          />
        }
        avatar={
          <SwapHistoryAvatar
            fromToken={
              swapMetadata.swapType === ISwapType.Sell
                ? swapMetadata.outTokenMetadata
                : swapMetadata.inTokenMetadata
            }
            toToken={
              swapMetadata.swapType === ISwapType.Sell
                ? swapMetadata.inTokenMetadata
                : swapMetadata.outTokenMetadata
            }
            toChainId={swapMetadata.chainId}
          />
        }
        title={
          swapMetadata.swapType === ISwapType.Sell
            ? swapMetadata.inTokenMetadata.name
            : swapMetadata.outTokenMetadata.name
        }
        isPending={isPending}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  if (limitOrderMetadata) {
    const primary =
      limitOrderMetadata.orderType === ILimitOrderType.Buy
        ? limitOrderMetadata.toTokenMetadata
        : limitOrderMetadata.fromTokenMetadata;
    return (
      <BaseTransactionListItem
        action={
          <ActionItem
            icon={faScaleBalanced}
            color={colors.swapLight}
            text={
              limitOrderMetadata.orderType === ILimitOrderType.Buy
                ? 'Limit Buy'
                : 'Limit Sell'
            }
          />
        }
        avatar={
          <CryptoHistoryAvatar
            token={primary}
            chainId={limitOrderMetadata.chainId}
          />
        }
        title={primary.name}
        isPending={isPending}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  if (tokenApprovalMetadata) {
    const isRevoke = BigInt(tokenApprovalMetadata.amount) === 0n;
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isRevoke ? faBan : faBadgeCheck}
          color={isRevoke ? colors.failure : colors.approve}
          text={isRevoke ? 'Revoke' : 'Approve'}
        />
      }
      avatar={
        <CryptoHistoryAvatar
          token={tokenApprovalMetadata.tokenMetadata}
          chainId={tokenApprovalMetadata.chainId}
        />
      }
      title={tokenApprovalMetadata.tokenMetadata.name}
      isPending={isPending}
      isDropped={isDropped}
      isFailed={isFailed}
      onPress={onPress}
    />;
  }

  if (tokenTransferMetadata) {
    return (
      <BaseTransactionListItem
        action={
          <ActionItem
            icon={faPaperPlane}
            iconSizeAdjustment={-2}
            color={colors.send}
            text={'Send'}
          />
        }
        avatar={
          <CryptoHistoryAvatar
            token={tokenTransferMetadata.tokenMetadata}
            chainId={tokenTransferMetadata.chainId}
          />
        }
        title={tokenTransferMetadata.tokenMetadata.name}
        isPending={isPending}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  if (nftTransferMetadata) {
    return (
      <BaseTransactionListItem
        action={
          <ActionItem
            icon={faPaperPlane}
            iconSizeAdjustment={-2}
            color={colors.send}
            text={'Send'}
          />
        }
        avatar={
          <NftHistoryAvatar
            imageUrl={nftTransferMetadata.imageUrl}
            chainId={nftTransferMetadata.chainId}
          />
        }
        title={nftTransferMetadata.name}
        isPending={isPending}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  const root = origin ? (
    <OriginImage uri={origin.favIconUrl} size={size} />
  ) : (
    <View
      className='bg-card items-center justify-center rounded-full'
      style={withSize(size)}
    >
      <FontAwesomeIcon
        icon={faCode}
        color={colors.textPrimary}
        size={adjust(20)}
      />
    </View>
  );

  if (
    tokenBurnMetadata.length + nftBurnMetadata.length > 0 &&
    resolved.chainId === ChainId.Solana
  ) {
    return (
      <BaseTransactionListItem
        action={
          <ActionItem icon={faFire} color={colors.failure} text={'Burn'} />
        }
        avatar={<HistoryAvatar root={root} chainId={resolved.chainId} />}
        title={'Close Token Accounts'}
        isPending={isPending}
        isDropped={isDropped}
        isFailed={isFailed}
        onPress={onPress}
      />
    );
  }

  return (
    <BaseTransactionListItem
      action={
        <ActionItem
          icon={isDropped ? faQuestionCircle : faHourglassStart}
          iconSizeAdjustment={isDropped ? 0 : -2}
          color={isDropped ? colors.failure : colors.primary}
          text={'Execute'}
        />
      }
      avatar={<HistoryAvatar root={root} chainId={resolved.chainId} />}
      title={originName ?? 'Pending Transaction'}
      isPending={isPending}
      isDropped={isDropped}
      isFailed={isFailed}
      onPress={onPress}
    />
  );
}

export function BaseTransactionListItem(props: {
  avatar: React.ReactNode;
  action: string | React.ReactNode;
  title: string;
  assetChange?: AssetTextData | Tuple<AssetTextData, 2>;
  isSpam?: boolean;
  isFailed?: boolean;
  isDropped?: boolean;
  isPending?: boolean;
  isBridging?: boolean;
  onPress: VoidFunction;
}) {
  const {
    assetChange,
    avatar,
    title,
    action,
    isFailed,
    isDropped,
    isPending,
    isBridging,
    onPress,
  } = props;

  const size = adjust(36);

  return (
    <ListItem onPress={onPress}>
      <View className='flex flex-row items-center justify-between space-x-2 overflow-hidden px-4 py-3'>
        <View className='flex flex-1 flex-row items-center space-x-4'>
          <View
            className='flex flex-none flex-row items-center justify-center rounded-full'
            style={withSize(size)}
          >
            {avatar}
          </View>
          <View className='flex flex-1 flex-col space-y-0.5 overflow-hidden'>
            {typeof action === 'string' ? (
              <Text
                className='text-text-secondary truncate text-xs font-normal'
                numberOfLines={1}
              >
                {action}
              </Text>
            ) : (
              action
            )}
            <Text
              className='text-text-primary truncate text-sm font-medium'
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
          <View className='flex flex-col overflow-hidden'>
            {isFailed ? (
              <View className='flex flex-row items-center justify-end'>
                <View className='bg-failure/10 rounded-lg px-2 py-1'>
                  <Text className='text-failure text-xs font-normal'>
                    {'Failed'}
                  </Text>
                </View>
              </View>
            ) : isDropped ? (
              <View className='flex flex-row items-center justify-end'>
                <View className='bg-failure/10 rounded-lg px-2 py-1'>
                  <Text className='text-failure text-xs font-normal'>
                    {'Dropped'}
                  </Text>
                </View>
              </View>
            ) : isPending ? (
              <View className='flex flex-row items-center justify-end'>
                <View className='bg-primary/10 flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                  <ActivityIndicator size={adjust(10, 2)} />
                  <Text className='text-primary text-xs font-normal'>
                    {'Executing'}
                  </Text>
                </View>
              </View>
            ) : isBridging ? (
              <View className='flex flex-row items-center justify-end'>
                <View className='bg-bridge/10 flex flex-row items-center justify-center space-x-1.5 rounded-lg px-2 py-1'>
                  <ActivityIndicator
                    size={adjust(10, 2)}
                    color={colors.bridge}
                  />
                  <Text className='text-bridge text-xs font-normal'>
                    {'Bridging'}
                  </Text>
                </View>
              </View>
            ) : !assetChange ? null : !isArray(assetChange) ? (
              <View className='flex flex-col items-end'>
                {typeof assetChange.text === 'string' ? (
                  <Text
                    className='truncate text-end text-sm font-medium'
                    numberOfLines={1}
                    style={{ color: assetChange.color }}
                  >
                    {assetChange.text}
                  </Text>
                ) : (
                  assetChange.text
                )}
              </View>
            ) : (
              <View className='flex flex-col items-end space-y-0.5'>
                {typeof assetChange[0].text === 'string' ? (
                  <Text
                    className='truncate text-end text-xs font-normal'
                    numberOfLines={1}
                    style={{ color: assetChange[0].color }}
                  >
                    {assetChange[0].text}
                  </Text>
                ) : (
                  assetChange[0].text
                )}
                {typeof assetChange[1].text === 'string' ? (
                  <Text
                    className='truncate text-end text-sm font-medium'
                    numberOfLines={1}
                    style={{ color: assetChange[1].color }}
                  >
                    {assetChange[1].text}
                  </Text>
                ) : (
                  assetChange[1].text
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </ListItem>
  );
}

export const CryptoHistoryAvatar = styled(function (props: {
  token: ITokenMetadata;
  chainId: number;
  size?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    token,
    chainId,
    size = adjust(36),
    borderColor = colors.background,
    style,
  } = props;

  return (
    <View style={style}>
      <CryptoAvatar
        url={token.imageUrl}
        chainId={chainId}
        symbol={token.symbol}
        size={size}
        chainBorderColor={borderColor}
      />
    </View>
  );
});

export const NftHistoryAvatar = styled(function (props: {
  nft?: INftMetadata;
  collection?: INftCollectionMetadata;
  imageUrl?: string;
  chainId: number;
  size?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    nft,
    collection,
    imageUrl,
    chainId,
    size = adjust(36),
    borderColor = colors.background,
    style,
  } = props;

  return (
    <View style={style}>
      <View style={withSize(size)}>
        <NFTAvatar
          url={nft?.imagePreviewUrl || collection?.imageUrl || imageUrl || ''}
          size={size}
        />
        <View className='absolute -bottom-0.5 -right-0.5'>
          <ChainAvatar
            chainInfo={getChainInfo(chainId)}
            border={true}
            size={adjust(size <= 24 ? 12 : 14, 2)}
            borderColor={borderColor}
          />
        </View>
      </View>
    </View>
  );
});

export const SwapHistoryAvatar = styled(function (props: {
  fromToken: ITokenMetadata;
  toToken: ITokenMetadata;
  fromChainId?: number;
  toChainId: number;
  size?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    fromToken,
    toToken,
    fromChainId,
    toChainId,
    size = adjust(36),
    borderColor = colors.background,
    style,
  } = props;

  return (
    <View style={style}>
      <View style={withSize(size)}>
        <View>
          <CryptoAvatar
            url={fromToken.imageUrl}
            symbol={fromToken.symbol}
            size={size - 12}
            chainBorderColor={borderColor}
          />
          {fromChainId && (
            <View className='absolute -left-1 -top-1'>
              <ChainAvatar
                chainInfo={getChainInfo(fromChainId)}
                border={true}
                size={adjust(size <= 12 ? 8 : 10, 2)}
                borderColor={borderColor}
              />
            </View>
          )}
        </View>
        <View
          className='bg-background absolute bottom-0 right-0 items-center justify-center rounded-full'
          style={withSize(size - 4)}
        >
          <CryptoAvatar
            className='rounded-full'
            url={toToken.imageUrl}
            symbol={toToken.symbol}
            size={size - 8}
          />
        </View>
      </View>
      <View className='absolute -bottom-0.5 -right-0.5'>
        <ChainAvatar
          chainInfo={getChainInfo(toChainId)}
          border={true}
          size={adjust(size <= 24 ? 12 : 14, 2)}
          borderColor={borderColor}
        />
      </View>
    </View>
  );
});

export const WalletHistoryAvatar = styled(function (props: {
  wallet: IWallet;
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { wallet, size = adjust(36), style } = props;

  return (
    <View style={style}>
      <WalletAvatar wallet={wallet} size={size} />
    </View>
  );
});

export const HistoryAvatar = styled(function (props: {
  chainId?: number;
  root?: React.ReactNode;
  size?: number;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    chainId,
    root,
    size = adjust(36),
    borderColor = colors.background,
    style,
  } = props;

  return (
    <View style={style}>
      <View style={withSize(size)}>
        {root}
        {chainId ? (
          <View className='absolute -bottom-0.5 -right-0.5'>
            <ChainAvatar
              chainInfo={getChainInfo(chainId)}
              border={true}
              size={adjust(size <= 24 ? 12 : 14, 2)}
              borderColor={borderColor}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});

const WalletInline = styled(function (props: {
  name?: string;
  isContract?: boolean;
  address: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { name, isContract, address, style } = props;
  return (
    <View style={style}>
      <View className='flex flex-row items-center justify-end space-x-2'>
        <WalletIcon
          icon={isContract ? faMemo : undefined}
          size={adjust(14, 2)}
          defaultStyle='neutral'
        />
        <Text
          className='text-text-secondary truncate text-xs font-normal'
          numberOfLines={1}
        >
          {name || formatAddress(address)}
        </Text>
      </View>
    </View>
  );
});

const SignerWalletInline = styled(function (props: {
  added: boolean;
  name?: string;
  size: 'xs' | 'sm';
  address: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { name, address, size, added, style } = props;
  return (
    <View style={style}>
      <View className='flex flex-row items-center justify-end space-x-2'>
        <Text
          className={cn({
            'text-sm font-medium': size === 'sm',
            'text-xs font-normal': size === 'xs',
            'text-success': added,
            'text-failure': !added,
          })}
        >
          {added ? '+1' : '-1'}
        </Text>
        <WalletIcon size={adjust(14, 2)} defaultStyle='neutral' />
        <Text
          className={cn('text-text-secondary truncate', {
            'text-sm font-medium': size === 'sm',
            'text-xs font-normal': size === 'xs',
          })}
          numberOfLines={1}
        >
          {name || formatAddress(address)}
        </Text>
      </View>
    </View>
  );
});

export const ActionItem = styled(function (props: {
  color: string;
  icon: IconProp;
  text: string;
  iconSizeAdjustment?: number;
  adornment?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { color, icon, text, iconSizeAdjustment = 0, adornment, style } = props;

  const size = adjust(14, 2);

  return (
    <View style={style}>
      <View className='flex flex-row items-center space-x-1'>
        <View
          className='items-center justify-center rounded-full'
          style={{
            ...withSize(size),
            backgroundColor: opacity(color, 20),
          }}
        >
          <FontAwesomeIcon
            icon={icon}
            size={adjust(10 + iconSizeAdjustment, 2)}
            color={color}
          />
        </View>
        <Text
          className='text-text-secondary truncate text-xs font-normal'
          numberOfLines={1}
        >
          {text}
        </Text>
        {adornment}
      </View>
    </View>
  );
});

export function OriginImage(props: { uri?: string; size: number }) {
  const { uri, size } = props;

  const [error, setError] = useState(false);

  return !error ? (
    <View className='overflow-hidden rounded-full' style={withSize(size)}>
      <Image
        source={{ uri }}
        style={withSize(size)}
        onError={() => setError(true)}
      />
    </View>
  ) : (
    <View
      className='bg-card-highlight items-center justify-center overflow-hidden rounded-full'
      style={withSize(size)}
    >
      <FontAwesomeIcon
        icon={faGlobe}
        color={colors.textSecondary}
        size={(size * 2) / 3}
      />
    </View>
  );
}
