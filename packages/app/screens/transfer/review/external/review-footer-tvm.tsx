import { toNano } from '@ton/core';
import { ethers } from 'ethers';
import { useMemo, useState } from 'react';
import {
  BasicFeeData,
  Loadable,
  RecipientAccount,
} from '../../../../common/types';
import { makeLoadable } from '../../../../common/utils/query';
import { isCryptoBalance } from '../../../../common/utils/types';
import { TextButton } from '../../../../components/button/text-button';
import { View } from '../../../../components/view';
import { ChainId, getChainInfo } from '../../../../features/chain';
import { useCreateAndExecuteTvmTransaction } from '../../../../features/tvm/transaction/execute';
import { getTransferMessage } from '../../../../features/tvm/utils';
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

export function TransferReviewFooterTvm(props: {
  nativeAsset: ICryptoBalance | null;
  asset: ICryptoBalance | INftBalance;
  recipient: RecipientAccount;
  amount: string;
  comment?: string;
  wallet: IWallet;
  client: IProtectedWalletClient;
  onCompleted: VoidFunction;
}) {
  const {
    nativeAsset,
    asset,
    recipient,
    comment,
    amount,
    wallet,
    client,
    onCompleted,
  } = props;

  const [showExecutionSheet, setShowExecutionSheet] = useState(false);

  const { executeTransaction } = useCreateAndExecuteTvmTransaction(
    client,
    wallet,
  );

  const tonBalance = nativeAsset?.balance ?? '0';
  const gasEstimate = isCryptoBalance(asset)
    ? toNano(asset.tokenMetadata.isNativeToken ? 0.01 : 0.1)
    : toNano(0.1);
  const sufficientTon =
    isCryptoBalance(asset) && asset.tokenMetadata.isNativeToken
      ? BigInt(tonBalance) - toNano(amount) >= gasEstimate
      : BigInt(tonBalance) >= gasEstimate;
  const isInvalid = !sufficientTon;

  const feeData: Loadable<BasicFeeData> = useMemo(
    () =>
      makeLoadable({
        units: [gasEstimate, gasEstimate, gasEstimate],
        token:
          nativeAsset?.tokenMetadata ??
          defaultCommonBalance(
            getChainInfo(ChainId.Ton).nativeCurrency,
            ChainId.Ton,
          ).tokenMetadata,
        additionalDecimals: 0,
      }),
    [gasEstimate, nativeAsset],
  );
  const gasLimit = useMemo(() => makeLoadable(BigInt(1)), []);

  const handleExecute = async () => {
    const metadata = getTransferMetadata(asset, recipient, amount);
    const message = await getTransferMessage(wallet, {
      asset,
      recipient: recipient.address,
      value: amount,
      comment,
    });
    const proposal = await executeTransaction({
      messages: [message],
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
    return proposal.tvmKey!.txHash ?? undefined;
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
          editable={false}
          chainId={ChainId.Ton}
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
          onChange={() => {}}
          onMissingGas={() => {}}
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
