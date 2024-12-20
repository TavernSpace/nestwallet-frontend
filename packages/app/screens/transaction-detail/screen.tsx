import { faArrowUpRightFromSquare } from '@fortawesome/pro-regular-svg-icons';
import { useCopy } from '../../common/hooks/copy';
import { useLinkToBlockchainExplorer } from '../../common/hooks/link';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { Loadable } from '../../common/types';
import { parseOrigin } from '../../common/utils/origin';
import { makeLoadable } from '../../common/utils/query';
import { adjust } from '../../common/utils/style';
import { IconButton } from '../../components/button/icon-button';
import { Field } from '../../components/field/field';
import { ScrollWrapper } from '../../components/scroll';
import { View } from '../../components/view';
import { ViewWithInset } from '../../components/view/view-with-inset';
import { colors } from '../../design/constants';
import { isRejectionSafeTransactionProposal } from '../../features/proposal/nonce';
import {
  resolveExternalTransactionProposal,
  resolveTransactionProposal,
} from '../../features/proposal/utils';
import {
  IContact,
  ITransaction,
  ITransactionMetaType,
  ITransactionProposalType,
  IWallet,
} from '../../graphql/client/generated/graphql';
import {
  BridgeProgressCard,
  GeneralInfoCard,
  WalletChangeCard,
} from '../../molecules/transaction/card';
import { ConfirmedSafeSignersSection } from '../../molecules/transaction/signer/section';
import { ExecutionBanner } from '../proposal/banner';

export function TransactionDetailScreen(props: {
  transaction: ITransaction;
  wallet: IWallet;
  wallets: IWallet[];
  contacts: Loadable<IContact[]>;
}) {
  const { transaction, wallet, wallets, contacts } = props;
  const { copy } = useCopy('Copied signer address!');
  const { explore } = useLinkToBlockchainExplorer(transaction.chainId, {
    type: 'tx',
    data: transaction.transactionHash,
  });

  const transactionProposal = transaction.proposal;
  const safeTransactionProposal =
    transactionProposal?.type === ITransactionProposalType.Safe
      ? transactionProposal.safe!
      : undefined;
  const externalTransactionProposal =
    !!transactionProposal &&
    transactionProposal.type !== ITransactionProposalType.Safe
      ? resolveExternalTransactionProposal(transactionProposal)
      : undefined;
  const proposal = transactionProposal
    ? resolveTransactionProposal(transactionProposal)
    : undefined;
  const origin = parseOrigin(proposal);
  const bridgeMetadata = externalTransactionProposal?.metadata?.find(
    (data) => data.type === ITransactionMetaType.Bridge,
  )?.bridge;

  const hasTransfers =
    transaction.transactionEvents.tokenTransfers.length > 0 ||
    transaction.transactionEvents.nftTransfers.length > 0;
  const hasApprovals =
    transaction.transactionEvents.tokenApprovals.length > 0 ||
    transaction.transactionEvents.nftApprovals.length > 0;
  const hasSafeModifications =
    transaction.transactionEvents.safeAddedOwners.length > 0 ||
    transaction.transactionEvents.safeRemovedOwners.length > 0;
  const isRejection =
    safeTransactionProposal &&
    isRejectionSafeTransactionProposal(safeTransactionProposal);

  useNavigationOptions({
    headerRight: () => (
      <View className='flex flex-col items-center justify-center p-2'>
        <IconButton
          icon={faArrowUpRightFromSquare}
          size={adjust(16, 2)}
          onPress={explore}
          color={colors.textPrimary}
        />
      </View>
    ),
  });

  return (
    <ScrollWrapper>
      <ViewWithInset className='h-full w-full' hasBottomInset={true}>
        <View className='flex flex-col space-y-1'>
          {!transaction.isSuccess && (
            <View className='px-4'>
              <ExecutionBanner
                isExecuting={false}
                isFailed={false}
                isReverted={true}
                isExecuted={false}
                isDropped={false}
                isReplaced={false}
              />
            </View>
          )}
          <View className='flex w-full flex-col space-y-3 pt-2'>
            <GeneralInfoCard
              className='mx-4'
              wallet={wallet}
              type='history'
              chainId={transaction.chainId}
              hash={transaction.transactionHash}
              executor={transaction.from}
              gasData={{
                gasFee: transaction.gasFee,
                gasToken: transaction.gasTokenMetadata,
                gasFeeInUSD: transaction.gasFeeUSD,
              }}
              origin={origin}
              wallets={wallets}
              contacts={contacts.data || []}
              endDate={transaction.minedAt}
            />
            {(hasTransfers ||
              hasApprovals ||
              hasSafeModifications ||
              isRejection ||
              (!transaction.isSuccess &&
                !!transaction.transactionEvents.error)) && (
              <WalletChangeCard
                className='mx-4'
                wallet={wallet}
                wallets={wallets}
                contacts={contacts.data ?? []}
                chainId={transaction.chainId}
                type='history'
                events={makeLoadable(transaction.transactionEvents)}
                rejectionNonce={
                  isRejection ? safeTransactionProposal.safeNonce! : undefined
                }
              />
            )}
            {externalTransactionProposal &&
              (externalTransactionProposal.bridgeData || bridgeMetadata) &&
              externalTransactionProposal.bridgeStatus && (
                <BridgeProgressCard
                  className='mx-4'
                  wallet={wallet}
                  chainId={transaction.chainId}
                  type='history'
                  failed={false}
                  wallets={wallets}
                  contacts={contacts.data ?? []}
                  bridgeData={
                    bridgeMetadata
                      ? {
                          legacy: false,
                          bridgeStatus:
                            externalTransactionProposal.bridgeStatus,
                          bridgeData: bridgeMetadata,
                        }
                      : {
                          legacy: true,
                          bridgeStatus:
                            externalTransactionProposal.bridgeStatus,
                          bridgeData: externalTransactionProposal.bridgeData!,
                        }
                  }
                />
              )}
            {safeTransactionProposal && (
              <Field label={`Signed By`}>
                <ConfirmedSafeSignersSection
                  wallets={wallets}
                  contacts={contacts.data ?? []}
                  confirmations={safeTransactionProposal.confirmations}
                  onSignerPressed={copy}
                />
              </Field>
            )}
          </View>
        </View>
      </ViewWithInset>
    </ScrollWrapper>
  );
}
