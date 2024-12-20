import { SafeInfoResponse } from '@safe-global/api-kit';
import { useEffect, useMemo } from 'react';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
  Nullable,
} from '../../common/types';
import { mapLoadable, sequenceLoadables } from '../../common/utils/query';
import { validateSignatures } from '../../features/safe/utils';
import {
  IConfirmation,
  IContact,
  ISafeMessageProposal,
  ISafeTransactionProposal,
  IWallet,
} from '../../graphql/client/generated/graphql';
import { isHardwareWallet, isValidSigner } from '../wallet/utils';

export type SafeSignerInfo = {
  name: string;
  address: string;
  hasSigned: boolean;
  signer?: IWallet;
  contact?: IContact;
  hasKeyring: boolean;
};

export type SafeExecutorInfo = {
  name: string;
  address?: string;
  signer?: IWallet;
  contact?: IContact;
};

export function useSafeSignerInfo(
  signers: ISignerWallet[],
  contacts: IContact[],
  signerInfo: SafeInfoResponse | string[],
  proposal?: ISafeTransactionProposal,
  message?: ISafeMessageProposal,
): SafeSignerInfo[] {
  const signerData = Array.isArray(signerInfo) ? signerInfo : signerInfo.owners;
  return useMemo(
    () =>
      signerData.map((owner, index) => {
        const hasSignedTx = !!proposal?.confirmations?.find(
          (confirmation) => confirmation.signer === owner,
        );
        const hasSignedMessage = !!message?.confirmations?.find(
          (confirmation) => confirmation.signer === owner,
        );
        const contact = contacts.find((contact) => contact.address === owner);
        const signer = signers.find((wallet) => wallet.address === owner);
        return {
          name: signer?.name ?? contact?.name ?? `Signer ${index + 1}`,
          address: owner,
          hasSigned: hasSignedTx || hasSignedMessage,
          signer,
          contact,
          hasKeyring: isValidSigner(signer),
        };
      }),
    [signers, contacts, signerInfo, proposal, message],
  );
}

export function useConfirmedSafeSignerInfo(
  wallets: IWallet[],
  contacts: IContact[],
  confirmations: IConfirmation[],
): SafeSignerInfo[] {
  return useMemo(
    () =>
      confirmations.map((confirmation, index) => {
        const contact = contacts.find(
          (contact) => contact.address === confirmation.signer,
        );
        const wallet = wallets.find(
          (wallet) => wallet.address === confirmation.signer,
        );
        const name = wallet?.name ?? contact?.name ?? `Signer ${index + 1}`;
        return {
          name: name,
          address: confirmation.signer,
          hasSigned: true,
          signer: wallet,
          contact: contact,
          hasKeyring: !!wallet,
        };
      }),
    [wallets, contacts, confirmations],
  );
}

export function useWithSafeSigner(
  proposal: ISafeMessageProposal | ISafeTransactionProposal,
  safeInfo: SafeInfoResponse,
  signers: ISignerWallet[],
  withSigner: (signer: ISignerWallet) => void,
) {
  const validSignatures = validateSignatures(
    proposal.confirmations.map((conf) => conf.signer),
    safeInfo.owners,
  );
  useEffect(() => {
    const unsigned = signers
      .filter(
        (signer) =>
          safeInfo.owners.includes(signer.address) &&
          signer.hasKeyring &&
          !validSignatures.includes(signer.address),
      )
      .sort(
        (s1, s2) =>
          (isHardwareWallet(s1) ? 1 : 0) - (isHardwareWallet(s2) ? 1 : 0),
      );
    if (unsigned.length > 0 && validSignatures.length < safeInfo.threshold) {
      withSigner(unsigned[0]!);
    }
  }, [proposal]);
}

export function useWithExecutor(
  executor: Nullable<ISignerWallet>,
  executors: IWalletWithLoadableBalance[],
  isExecutable: boolean,
  withExecutor: (executor: ISignerWallet) => void,
) {
  const executorsWithBalance = useLoadExecutorBalances(executors);
  useEffect(() => {
    if (
      isExecutable &&
      executor === undefined &&
      executorsWithBalance.success
    ) {
      const validExecutors = executorsWithBalance.data
        .filter((exe) => exe.wallet.hasKeyring && !!exe.balance)
        .sort((s1, s2) => {
          const first = BigInt(s2.balance);
          const second = BigInt(s1.balance);
          return first < second ? -1 : first > second ? 1 : 0;
        });
      if (validExecutors.length > 0) {
        withExecutor(
          validExecutors.find((exe) => !isHardwareWallet(exe.wallet))?.wallet ||
            validExecutors[0]!.wallet,
        );
      }
    }
  }, [executor, isExecutable, executorsWithBalance.success]);
}

export function useLoadExecutorBalances(
  executors: IWalletWithLoadableBalance[],
) {
  return useMemo(
    () =>
      sequenceLoadables(
        executors.map((exe) =>
          mapLoadable(exe.balance)((balance) => ({
            wallet: exe.wallet,
            balance,
          })),
        ),
      ),
    [executors],
  );
}
