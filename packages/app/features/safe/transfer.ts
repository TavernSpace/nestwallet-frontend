import { formatCryptoFloat } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { AssetTransfer } from '../../common/types';
import { isCryptoBalance } from '../../common/utils/types';
import {
  ICreateSafeTransactionProposalInput,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { getTransferTransactionData } from '../evm/contract/encode';
import { getMultiSendTransactionData } from './encode';
import { createSafe } from './utils';

export async function getTransfersSafeTransactionProposalInput(
  wallet: IWallet,
  transfers: AssetTransfer[],
): Promise<ICreateSafeTransactionProposalInput> {
  const txData = transfers.map((transfer) =>
    getTransferTransactionData(wallet.address, transfer),
  );
  if (txData.length > 1) {
    const safe = await createSafe(wallet);
    const multiSendOnlyContract = await safe.getMultiSendAddress();
    const tx = getMultiSendTransactionData(
      txData.map((data) => ({
        to: data.to,
        value: data.value,
        data: data.data || '0x',
      })),
      multiSendOnlyContract,
    );
    const description = transfers.map((transfer) =>
      isCryptoBalance(transfer.asset)
        ? ` ${formatCryptoFloat(
            parseFloat(transfer.value),
            NumberType.TokenTx,
          )} ${transfer.asset.tokenMetadata.symbol}`
        : ` ${transfer.asset.collectionMetadata.name}`,
    );

    return {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: `Send${description.join(',')}`,
      toAddress: tx.to,
      value: tx.value,
      data: tx.data,
      operation: 1,
    };
  } else {
    const tx = txData[0]!;
    const transfer = transfers[0]!;
    const description = isCryptoBalance(transfer.asset)
      ? `Send ${formatCryptoFloat(
          parseFloat(transfer.value),
          NumberType.TokenTx,
        )} ${transfer.asset.tokenMetadata.symbol}`
      : `Send ${transfer.asset.collectionMetadata.name}`;
    return {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description,
      toAddress: tx.to,
      value: tx.value,
      data: tx.data,
    };
  }
}
