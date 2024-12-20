import { ethers } from 'ethers';
import _ from 'lodash';
import { useQueryRefetcher } from '../../common/hooks/query';
import { AssetTransfer, RecipientAccount } from '../../common/types';
import { loadDataFromQuery } from '../../common/utils/query';
import { isCryptoBalance } from '../../common/utils/types';
import { isSupportedChain } from '../../features/chain';
import { isDust, isSimpleBalance } from '../../features/crypto/balance';
import { visibilityFilter } from '../../features/crypto/visibility';
import { getTransferTransactionData } from '../../features/evm/contract/encode';
import { useTransactionGasQueries } from '../../features/evm/transaction/gas';
import { useNftBalancesInfiniteQuery } from '../../features/wallet/query';
import {
  IContractVisibility,
  ICryptoBalance,
  ICryptoPositionInputType,
  INftBalance,
  ITransactionMetadataInput,
  ITransactionMetaType,
  ITransactionNftTransferMetadata,
  ITransactionTokenTransferMetadata,
  IWallet,
  IWalletType,
  useCryptoPositionsQuery,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';

export function getAmountUSD(
  asset: ICryptoBalance | INftBalance,
  amount: string,
) {
  if (!isCryptoBalance(asset) || amount === '') return '0';
  const base = parseFloat(amount) * parseFloat(asset.tokenMetadata.price);
  const [whole, decimal] = base.toFixed(20).split('.');
  const amountUSD =
    decimal && decimal.length > 2
      ? `${whole}.${decimal.slice(0, 2)}`
      : base.toString();
  return amountUSD;
}

export function getTransferMetadata(
  asset: ICryptoBalance | INftBalance,
  recipient: RecipientAccount,
  amount: string,
) {
  const metaType = isCryptoBalance(asset)
    ? ITransactionMetaType.TokenTransfer
    : ITransactionMetaType.NftTransfer;
  const data:
    | ITransactionTokenTransferMetadata
    | ITransactionNftTransferMetadata =
    metaType === ITransactionMetaType.TokenTransfer
      ? {
          chainId: asset.chainId,
          amount: ethers
            .parseUnits(
              amount,
              (asset as ICryptoBalance).tokenMetadata.decimals,
            )
            .toString(),
          toAddress: recipient.address,
          tokenAddress: asset.address,
          tokenMetadata: (asset as ICryptoBalance).tokenMetadata,
        }
      : {
          chainId: asset.chainId,
          amount,
          name: (asset as INftBalance).nftMetadata.name,
          imageUrl: (asset as INftBalance).nftMetadata.imagePreviewUrl,
          nftAddress: asset.address,
          toAddress: recipient.address,
          tokenId: (asset as INftBalance).tokenId,
        };
  const input: ITransactionMetadataInput = {
    type: metaType,
    data,
  };
  return input;
}

export function useTransferTransactionGasQueries(
  wallet: IWallet,
  asset: ICryptoBalance | INftBalance,
  recipient: RecipientAccount,
  amount: string,
) {
  const normalizedAmount = _.isEmpty(amount) ? '0' : amount;
  const transferTx = getTransferTransactionData(wallet.address, {
    asset,
    value: normalizedAmount,
    recipient: recipient.address,
  });
  const { feeData, gasLimit } = useTransactionGasQueries(
    {
      chainId: asset.chainId,
      from: wallet.address,
      to: transferTx.to,
      data: transferTx.data,
      value: transferTx.value,
    },
    {
      enabled: wallet.type !== IWalletType.Safe && normalizedAmount !== '0',
    },
  );
  return { transferTx, feeData, gasLimit };
}

export function useCryptoPositions(
  wallet: IWallet,
  transfers: AssetTransfer[],
) {
  const cryptoPositionsQuery = useCryptoPositionsQuery(
    { input: { walletId: wallet.id, type: ICryptoPositionInputType.All } },
    { staleTime: Infinity },
  );
  const shownCrypto = loadDataFromQuery(cryptoPositionsQuery, (data) =>
    data.cryptoPositions.edges
      .filter(
        (balance) =>
          isSupportedChain(balance.node.chainId) &&
          visibilityFilter(balance.node) &&
          isSimpleBalance(balance.node) &&
          !isDust(balance.node),
      )
      .map((edge) => edge.node as ICryptoBalance)
      .map((crypto) => {
        const previousTransfers = transfers.filter(
          (transfer) => transfer.asset.address === crypto.address,
        );
        if (previousTransfers.length > 0) {
          const newBalance = previousTransfers.reduce<bigint>(
            (prev, cur) =>
              prev -
              ethers.parseUnits(cur.value, crypto.tokenMetadata.decimals),
            BigInt(crypto.balance),
          );
          const fraction =
            parseFloat(
              ethers.formatUnits(newBalance, crypto.tokenMetadata.decimals),
            ) /
            parseFloat(
              ethers.formatUnits(crypto.balance, crypto.tokenMetadata.decimals),
            );
          return newBalance > 0n
            ? {
                ...crypto,
                balance: newBalance.toString(),
                balanceInUSD: (
                  fraction * parseFloat(crypto.balanceInUSD)
                ).toFixed(2),
              }
            : null;
        } else {
          return crypto;
        }
      })
      .filter((crypto): crypto is ICryptoBalance => !!crypto),
  );
  return { cryptoBalances: shownCrypto };
}

export function useNftBalances(wallet: IWallet, transfers: AssetTransfer[]) {
  const nftPermissionsQuery = useQueryRefetcher(
    graphqlType.ContractPermission,
    useNftBalancesInfiniteQuery(
      { walletId: wallet.id },
      { staleTime: Infinity },
    ),
  );

  const shownNFTs = loadDataFromQuery(nftPermissionsQuery, (data) =>
    data.pages
      .flatMap((page) =>
        page.nftBalances.edges.map((edge) => edge.node as INftBalance),
      )
      .filter(
        (nft) =>
          isSupportedChain(nft.chainId) &&
          nft.visibility !== IContractVisibility.Hidden,
      )
      .filter(
        (nft) =>
          transfers.filter(
            (transfer) =>
              !isCryptoBalance(transfer.asset) &&
              transfer.asset.address === nft.address &&
              transfer.asset.tokenId === nft.tokenId,
          ).length === 0,
      ),
  );
  return { nftBalances: shownNFTs };
}
