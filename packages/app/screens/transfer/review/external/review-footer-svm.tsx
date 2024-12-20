import { ethers } from 'ethers';
import { useMemo, useState } from 'react';
import {
  BasicFeeData,
  Loadable,
  RecipientAccount,
} from '../../../../common/types';
import {
  loadDataFromQuery,
  makeLoadable,
  mapLoadable,
  spreadLoadable,
} from '../../../../common/utils/query';
import { isCryptoBalance } from '../../../../common/utils/types';
import { TextButton } from '../../../../components/button/text-button';
import { View } from '../../../../components/view';
import { ChainId, getChainInfo } from '../../../../features/chain';
import { useComputeUnitPriceQuery } from '../../../../features/svm/transaction/compute';
import { getTransferTransactionData } from '../../../../features/svm/transaction/encode';
import { useCreateAndExecuteSvmTransaction } from '../../../../features/svm/transaction/execute';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import {
  ICryptoBalance,
  INftBalance,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { GasSection } from '../../../../molecules/gas/selector';
import { ExecutionSheet } from '../../../proposal/execution-sheet';
import { defaultCommonBalance } from '../../../quick-trade/utils';
import { getTransferMetadata } from '../../utils';

export function TransferReviewFooterSvm(props: {
  nativeAsset: ICryptoBalance | null;
  asset: ICryptoBalance | INftBalance;
  recipient: RecipientAccount;
  amount: string;
  wallet: IWallet;
  client: IProtectedWalletClient;
  onCompleted: VoidFunction;
}) {
  const { nativeAsset, asset, recipient, amount, wallet, client, onCompleted } =
    props;

  const [missingGas, setMissingGas] = useState(true);
  const [computePrice, setComputePrice] = useState<bigint>();
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);

  const { signAndSendTransaction } = useCreateAndExecuteSvmTransaction(
    client,
    wallet,
  );

  const computeUnitEstimate = isCryptoBalance(asset)
    ? 10000
    : asset.nftMetadata.compressed
    ? 100_000
    : 10000;

  const computeUnitPriceQuery = useComputeUnitPriceQuery([], 100_000, 95);
  const computeUnitPrice = loadDataFromQuery(computeUnitPriceQuery);

  const feeData: Loadable<BasicFeeData> = useMemo(
    () =>
      mapLoadable(computeUnitPrice)((price) => ({
        units: [
          BigInt(Math.floor(price * 0.6)),
          BigInt(Math.floor(price * 0.8)),
          BigInt(price),
        ],
        token:
          nativeAsset?.tokenMetadata ??
          defaultCommonBalance(
            getChainInfo(ChainId.Solana).nativeCurrency,
            ChainId.Solana,
          ).tokenMetadata,
        additionalDecimals: 6,
      })),
    [...spreadLoadable(computeUnitPrice), nativeAsset],
  );

  const gasLimit = useMemo(
    () => makeLoadable(BigInt(computeUnitEstimate)),
    [computeUnitEstimate],
  );

  const isInvalid = missingGas || !computeUnitPrice.success;

  const handleExecute = async () => {
    const metadata = getTransferMetadata(asset, recipient, amount);
    const data = await getTransferTransactionData(
      wallet.address,
      [
        {
          asset,
          recipient: recipient.address,
          value: amount,
        },
      ],
      computePrice,
    );
    const proposal = await signAndSendTransaction({
      data,
      interactedAddresses: [
        {
          address: recipient.address,
          chainId: asset.chainId,
          interactionCount: 0,
          sendCount: 1,
        },
      ],
      metadata: [metadata],
    });
    const txHash = proposal.svmKey!.txHash!;
    return txHash;
  };

  const handleSubmit = async () => {
    if (isInvalid) return;
    setShowExecutionSheet(true);
  };

  return (
    <>
      <View className='flex flex-col space-y-2'>
        <GasSection
          hasBackground={true}
          chainId={ChainId.Solana}
          feeData={feeData}
          gasLimit={gasLimit}
          balance={makeLoadable(
            nativeAsset ? BigInt(nativeAsset.balance) : null,
          )}
          sendAmount={
            isCryptoBalance(asset) && asset.tokenMetadata.isNativeToken
              ? ethers.parseUnits(amount, 9).toString()
              : '0'
          }
          onChange={(level) => setComputePrice(level.estimatedGasPrice)}
          onMissingGas={(missingGas) => setMissingGas(missingGas)}
        />
        <TextButton
          onPress={handleSubmit}
          text={'Execute'}
          disabled={isInvalid}
        />
      </View>
      <ExecutionSheet
        chainId={asset.chainId}
        blockchain={wallet.blockchain}
        executor={wallet}
        isShowing={showExecutionSheet}
        onClose={() => setShowExecutionSheet(false)}
        onCompleted={onCompleted}
        onExecute={handleExecute}
      />
    </>
  );
}
