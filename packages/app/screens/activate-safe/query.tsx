import { TransactionOptions } from '@safe-global/safe-core-sdk-types';
import { useState } from 'react';
import { useMutationEmitter } from '../../common/hooks/query';
import { ISignerWallet, VoidPromiseFunction } from '../../common/types';
import { loadDataFromQuery } from '../../common/utils/query';
import { ChainId } from '../../features/chain';
import { nullAddress } from '../../features/evm/constants';
import { useTransactionGasQueries } from '../../features/evm/transaction/gas';
import { getTransactionOptions } from '../../features/proposal/gas';
import { GasPriceLevel } from '../../features/proposal/types';
import { useDeployInactiveSafeTransaction } from '../../features/safe/create';
import { useNativeBalancesWithWalletsQuery } from '../../features/wallet/native-balance';
import { IProtectedWalletClient } from '../../features/wallet/service/interface';
import { getValidSigners } from '../../features/wallet/utils';
import {
  IBlockchainType,
  IContact,
  IUser,
  IWallet,
  useContactsQuery,
  useDeploySafeWalletMutation,
} from '../../graphql/client/generated/graphql';
import { graphqlType } from '../../graphql/types';
import { ExecutionSheet } from '../proposal/execution-sheet';
import { SafeSelectExecutorSheet } from '../proposal/safe/select-executor-sheet';
import { ActivateSafeView } from './view';

interface ActivateSafeQueryProps {
  user: IUser;
  wallet: IWallet;
  signers: ISignerWallet[];
  walletService: IProtectedWalletClient;
  onCompleted: VoidFunction;
  refetchUser: VoidPromiseFunction;
}

export function ActivateSafeWithQuery(props: ActivateSafeQueryProps) {
  const { user, wallet, signers, walletService, onCompleted, refetchUser } =
    props;

  const [selectedExecutor, setSelectedExecutor] =
    useState<ISignerWallet | null>();
  const [transactionOptions, setTransactionOptions] =
    useState<TransactionOptions>();
  const [showSelectExecutorSheet, setShowSelectExecutorSheet] = useState(false);
  const [showExecutionSheet, setShowExecutionSheet] = useState(false);

  const deployInactiveSafeTransaction = useDeployInactiveSafeTransaction();
  const deploySafeWalletMutation = useMutationEmitter(
    graphqlType.Wallet,
    useDeploySafeWalletMutation(),
  );

  const contactsQuery = useContactsQuery(
    {
      filter: {
        organizationId: {
          eq: wallet.organization.id,
        },
      },
    },
    { staleTime: 1000 * 30 },
  );
  const contacts = loadDataFromQuery(
    contactsQuery,
    (data) =>
      data.contacts.filter(
        (contact) => contact.blockchain === IBlockchainType.Evm,
      ) as IContact[],
  );

  const isEnabled = selectedExecutor !== null;
  const fromAddress =
    wallet.chainId === ChainId.ZkSync ? selectedExecutor?.address : nullAddress;
  const { feeData, gasLimit } = useTransactionGasQueries(
    {
      chainId: wallet.chainId,
      from: fromAddress!,
      to: wallet.creationData!.factoryAddress,
      data: wallet.creationData!.creationData,
      value: '0x0',
    },
    { enabled: isEnabled && !!fromAddress },
  );

  const executors = useNativeBalancesWithWalletsQuery(
    wallet.chainId,
    getValidSigners(signers, IBlockchainType.Evm),
    { enabled: isEnabled },
  );

  const handleChangeGasData = (
    gasLevel: GasPriceLevel,
    gasLimits: bigint[],
  ) => {
    if (gasLimits.length !== 1) return;
    setTransactionOptions(getTransactionOptions(gasLimits[0]!, gasLevel));
  };

  const handleExecute = async (
    executor: ISignerWallet | null,
    options: TransactionOptions,
  ) => {
    if (executor) {
      const signer = await walletService.getEvmSigner(
        wallet.chainId,
        executor,
        true,
      );
      const { txHash } = await deployInactiveSafeTransaction.mutateAsync(
        signer,
        wallet,
        options,
      );
      return txHash;
    } else {
      const result = await deploySafeWalletMutation.mutateAsync({
        id: wallet.id,
      });
      return result.deploySafeWallet.txHash ?? undefined;
    }
  };

  const handleDeployFreeSafe = async () => {
    await deploySafeWalletMutation.mutateAsync({
      id: wallet.id,
    });
    onCompleted();
  };

  const handleSelectExecutor = (executor: ISignerWallet | null) => {
    setSelectedExecutor(executor);
    setShowSelectExecutorSheet(false);
  };

  const handleSelectExecutorClose = () => {
    setShowSelectExecutorSheet(false);
  };

  const handleSelectExecutorPress = () => {
    setShowSelectExecutorSheet(true);
  };

  const handleCreateSafe = () => {
    setShowExecutionSheet(true);
  };

  const canUseRelay = user.safeDeployCredit > 0 && wallet.chainId !== 1;
  const handleRelay = () => {
    setSelectedExecutor(null);
  };

  return (
    <>
      <ActivateSafeView
        contacts={contacts}
        executor={selectedExecutor}
        executors={executors}
        gasLimit={gasLimit}
        feeData={feeData}
        signers={signers}
        user={user}
        wallet={wallet}
        onCreateSafe={handleCreateSafe}
        onFreeSafe={handleDeployFreeSafe}
        refetchUser={refetchUser}
        onChangeGasData={handleChangeGasData}
        onSelectExecutor={handleSelectExecutor}
        onSelectExecutorPress={handleSelectExecutorPress}
      />
      <SafeSelectExecutorSheet
        chainId={wallet.chainId}
        executor={selectedExecutor}
        executors={executors}
        isShowing={showSelectExecutorSheet}
        onSelectExecutor={handleSelectExecutor}
        onRelay={canUseRelay ? handleRelay : undefined}
        onClose={handleSelectExecutorClose}
      />
      {selectedExecutor && transactionOptions && (
        <ExecutionSheet
          chainId={wallet.chainId}
          blockchain={wallet.blockchain}
          executor={selectedExecutor}
          isShowing={showExecutionSheet}
          onClose={() => setShowExecutionSheet(false)}
          onCompleted={onCompleted}
          onExecute={() => handleExecute(selectedExecutor, transactionOptions)}
        />
      )}
    </>
  );
}
