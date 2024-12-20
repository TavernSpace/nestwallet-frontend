import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { ethers } from 'ethers';
import { useState } from 'react';
import { RecipientAccount } from '../../../../common/types';
import { makeLoadable } from '../../../../common/utils/query';
import { TextButton } from '../../../../components/button/text-button';
import { View } from '../../../../components/view';
import { useCreateAndExecuteEthKeyTransaction } from '../../../../features/evm/transaction/execute';
import { transferGasMultiplier } from '../../../../features/proposal/fee';
import { getTransactionOptions } from '../../../../features/proposal/gas';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { IProtectedWalletClient } from '../../../../features/wallet/service/interface';
import {
  ICryptoBalance,
  INftBalance,
  IWallet,
} from '../../../../graphql/client/generated/graphql';
import { GasSection } from '../../../../molecules/gas/selector';
import { ExecutionSheet } from '../../../proposal/execution-sheet';
import {
  getTransferMetadata,
  useTransferTransactionGasQueries,
} from '../../utils';

export function TransferReviewFooterEvm(props: {
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

  const [showExecutionSheet, setShowExecutionSheet] = useState(false);
  const [transactionOptions, setTransactionOptions] =
    useState<TransactionOptions>();
  const [missingGas, setMissingGas] = useState(false);

  const { executeTransaction } = useCreateAndExecuteEthKeyTransaction(
    client,
    wallet,
  );
  const { transferTx, feeData, gasLimit } = useTransferTransactionGasQueries(
    wallet,
    asset,
    recipient,
    amount,
  );

  const isInvalid = missingGas || !feeData.success || !gasLimit.success;

  const handleExecute = async () => {
    if (transactionOptions) {
      const metadata = getTransferMetadata(asset, recipient, amount);
      const proposal = await executeTransaction({
        transaction: {
          chainId: asset.chainId,
          from: wallet.address,
          to: transferTx.to,
          data: transferTx.data,
          value: transferTx.value,
        },
        transactionOptions,
        interactedAddresses: [
          {
            address: ethers.getAddress(recipient.address),
            chainId: asset.chainId,
            interactionCount: 0,
            sendCount: 1,
          },
        ],
        metadata: [metadata],
      });
      const txHash = proposal.ethKey!.txHash!;
      return txHash;
    }
    return undefined;
  };

  const handleSubmit = async () => {
    if (isInvalid) return;
    setShowExecutionSheet(true);
  };

  const handleGasLevelChange = (
    gasLevel: GasPriceLevel,
    gasLimits: bigint[],
  ) => {
    if (gasLimits.length !== 1) return;
    setTransactionOptions(getTransactionOptions(gasLimits[0]!, gasLevel));
  };

  return (
    <>
      <View className='flex flex-col space-y-2'>
        <GasSection
          hasBackground={true}
          chainId={asset.chainId}
          feeData={feeData}
          gasLimit={gasLimit}
          balance={makeLoadable(
            nativeAsset ? BigInt(nativeAsset.balance) : null,
          )}
          gasMultiplier={transferGasMultiplier}
          sendAmount={transferTx.value ?? '0'}
          onChange={handleGasLevelChange}
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
