import { formatCrypto } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { colors } from '../../design/constants';
import { UINT256_MAX, lifiAddress } from '../../features/evm/constants';
import {
  ITransactionNftApprovalEvent,
  ITransactionNftTransferEvent,
  ITransactionTokenApprovalEvent,
  ITransactionTokenTransferEvent,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { AssetTextData } from './types';

export const contractMap: Record<
  string,
  {
    name: string;
    imageUrl: string;
  }
> = {
  [lifiAddress]: {
    name: 'LI.FI Diamond',
    imageUrl:
      'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/contract/lifi.png',
  },
};

export function assetChangeFromTokenTransfer(
  wallet: IWallet,
  transfer: ITransactionTokenTransferEvent,
): AssetTextData {
  const formatted = formatCrypto(
    transfer.quantity,
    transfer.tokenMetadata.decimals,
    NumberType.TokenTx,
  );
  return {
    text: `${wallet.address === transfer.to ? '+' : '-'}${formatted} ${
      transfer.tokenMetadata.symbol
    }`,
    color: wallet.address === transfer.to ? colors.success : colors.failure,
  };
}

export function assetChangeFromNftTransfer(
  wallet: IWallet,
  transfer: ITransactionNftTransferEvent,
): AssetTextData {
  return {
    text: `${wallet.address === transfer.to ? '+' : '-'}${transfer.quantity} ${
      transfer.collectionMetadata.name === 'Other'
        ? transfer.collectionMetadata.symbol ||
          transfer.nftMetadata.name ||
          'Unknown NFT'
        : transfer.collectionMetadata.name ||
          transfer.collectionMetadata.symbol ||
          transfer.nftMetadata.name ||
          'Unknown NFT'
    }`,
    color: wallet.address === transfer.to ? colors.success : colors.failure,
  };
}

export function assetChangeFromTokenApproval(
  wallet: IWallet,
  approval: ITransactionTokenApprovalEvent,
): AssetTextData {
  const isInfinite = approval.quantity === UINT256_MAX;
  const formatted = formatCrypto(
    approval.quantity,
    approval.tokenMetadata.decimals,
    NumberType.TokenTx,
  );
  const isRevoke = BigInt(approval.quantity) === 0n;
  return {
    text: isInfinite
      ? `Unlimited ${approval.tokenMetadata.symbol}`
      : isRevoke
      ? approval.tokenMetadata.symbol
      : `${formatted} ${approval.tokenMetadata.symbol}`,
    color: isRevoke ? colors.failure : colors.approve,
  };
}

export function assetChangeFromNftApproval(
  wallet: IWallet,
  approval: ITransactionNftApprovalEvent,
): AssetTextData {
  const isRevoke = !!approval.quantity && BigInt(approval.quantity) === 0n;
  return {
    text: isRevoke
      ? approval.nftMetadata
        ? approval.nftMetadata.name || 'Unknown NFT'
        : approval.collectionMetadata.name || 'Unknown NFT'
      : approval.isForAll
      ? `All ${approval.collectionMetadata.name || 'Unknown NFT'}`
      : approval.nftMetadata?.name || 'Unknown NFT',
    color: colors.approve,
  };
}
