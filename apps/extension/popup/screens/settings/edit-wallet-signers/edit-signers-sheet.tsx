import { useResetToRoutes } from '@nestwallet/app/common/hooks/navigation';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { ActionSheet } from '@nestwallet/app/components/sheet';
import {
  getSafeAddOwnerWithThresholdTransactionData,
  getSafeChangeThresholdTransactionData,
  getSafeRemoveOwnerTransactionData,
  getSafeSwapOwnerTransactionData,
} from '@nestwallet/app/features/safe/encode';
import { getPrevOwner } from '@nestwallet/app/features/safe/utils';
import {
  ICreateSafeTransactionProposalInput,
  ITransactionProposalType,
  IWallet,
  useCreateTransactionProposalMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { EditOperation } from '@nestwallet/app/screens/wallet/edit-signers/edit-signer-sheet/content';
import { EditSignersWithQuery } from '@nestwallet/app/screens/wallet/edit-signers/edit-signer-sheet/query';
import { useNavigation } from '@react-navigation/native';
import { SafeInfoResponse } from '@safe-global/api-kit';

interface EditSignersSheetProps {
  wallet: IWallet;
  operation: EditOperation;
  isShowing: boolean;
  onClose: VoidFunction;
}

export function EditSignersSheet(props: EditSignersSheetProps) {
  const { wallet, operation, isShowing, onClose } = props;
  const navigation = useNavigation();
  const resetToRoutes = useResetToRoutes();

  const createTransactionProposalMutation = useMutationEmitter(
    graphqlType.Proposal,
    useCreateTransactionProposalMutation(),
  );

  const handleChangeThreshold = async (
    safeInfo: SafeInfoResponse,
    threshold: number,
  ) => {
    const txData = getSafeChangeThresholdTransactionData(
      wallet.address,
      threshold,
    );
    const proposalInput: ICreateSafeTransactionProposalInput = {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: `Modify threshold of ${wallet.name} from ${safeInfo.threshold}/${safeInfo.owners.length} to ${threshold}/${safeInfo.owners.length}.`,
      data: txData.data,
      toAddress: txData.to,
      value: txData.value,
    };
    const proposal = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.Safe,
        safe: proposalInput,
      },
    });
    onClose();
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: wallet.id,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'transactionProposal',
          params: {
            proposalId: proposal.createTransactionProposal.id,
            walletId: wallet.id,
          },
        },
      },
    ]);
  };

  const handleAddSigner = async (
    safeInfo: SafeInfoResponse,
    owner: string,
    threshold: number,
  ) => {
    const txData = getSafeAddOwnerWithThresholdTransactionData(
      wallet.address,
      owner,
      threshold,
    );
    const proposalInput: ICreateSafeTransactionProposalInput = {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: `Add ${owner} as an owner to ${
        wallet.name
      } with new threshold ${threshold}/${safeInfo.owners.length + 1}.`,
      data: txData.data,
      toAddress: txData.to,
      value: txData.value,
    };
    const proposal = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.Safe,
        safe: proposalInput,
      },
    });
    onClose();
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: wallet.id,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'transactionProposal',
          params: {
            proposalId: proposal.createTransactionProposal.id,
            walletId: wallet.id,
          },
        },
      },
    ]);
  };

  const handleRemoveSigner = async (
    safeInfo: SafeInfoResponse,
    owner: string,
    threshold: number,
  ) => {
    const txData = getSafeRemoveOwnerTransactionData(
      wallet.address,
      getPrevOwner(safeInfo, owner),
      owner,
      threshold,
    );
    const proposalInput: ICreateSafeTransactionProposalInput = {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: `Remove ${owner} as an owner from ${
        wallet.name
      } with new threshold ${threshold}/${safeInfo.owners.length - 1}.`,
      data: txData.data,
      toAddress: txData.to,
      value: txData.value,
    };
    const proposal = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.Safe,
        safe: proposalInput,
      },
    });
    onClose();
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: wallet.id,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'transactionProposal',
          params: {
            proposalId: proposal.createTransactionProposal.id,
            walletId: wallet.id,
          },
        },
      },
    ]);
  };

  const handleSwapSafeSigner = async (
    safeInfo: SafeInfoResponse,
    oldOwner: string,
    newOwner: string,
  ) => {
    const txData = getSafeSwapOwnerTransactionData(
      wallet.address,
      getPrevOwner(safeInfo, oldOwner),
      oldOwner,
      newOwner,
    );
    const proposalInput: ICreateSafeTransactionProposalInput = {
      chainId: wallet.chainId,
      walletId: wallet.id,
      description: `Change owner ${oldOwner} to ${newOwner} on ${wallet.name}.`,
      data: txData.data,
      toAddress: txData.to,
      value: txData.value,
    };
    const proposal = await createTransactionProposalMutation.mutateAsync({
      input: {
        type: ITransactionProposalType.Safe,
        safe: proposalInput,
      },
    });
    onClose();
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: wallet.id,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'transactionProposal',
          params: {
            proposalId: proposal.createTransactionProposal.id,
            walletId: wallet.id,
          },
        },
      },
    ]);
  };

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <EditSignersWithQuery
        wallet={wallet}
        operation={operation}
        onClose={onClose}
        onAddSigner={handleAddSigner}
        onRemoveSigner={handleRemoveSigner}
        onChangeThreshold={handleChangeThreshold}
        onSwapSigner={handleSwapSafeSigner}
      />
    </ActionSheet>
  );
}
