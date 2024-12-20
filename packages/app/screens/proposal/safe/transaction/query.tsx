import { SafeInfoResponse } from '@safe-global/api-kit';
import {
  ISignerWallet,
  IWalletWithLoadableBalance,
  Loadable,
  SafeNonceData,
  SafeTransactionProposalWithNonce,
  VoidPromiseFunction,
} from '../../../../common/types';
import { tuple } from '../../../../common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  onLoadable,
} from '../../../../common/utils/query';
import { ActivityIndicator } from '../../../../components/activity-indicator';
import { View } from '../../../../components/view';
import { ChainId } from '../../../../features/chain';
import {
  useEncodeTransactionProposalQuery,
  useEstimateGasLimitForSafeTransactionProposalQuery,
} from '../../../../features/proposal/gas';
import { GasPriceLevel } from '../../../../features/proposal/types';
import { isSafeTransactionProposalComplete } from '../../../../features/proposal/utils';
import { useSimulateSafeTransactionProposal } from '../../../../features/safe/simulate';
import {
  SafeTxState,
  getSafeTxStateFromSafeTransactionProposal,
} from '../../../../features/safe/utils';
import {
  IContact,
  IFeeData,
  ISafeTransactionProposal,
  ITransactionEvents,
  IWallet,
  useFeeDataQuery,
} from '../../../../graphql/client/generated/graphql';
import { ErrorScreen } from '../../../../molecules/error/screen';
import { useLanguageContext } from '../../../../provider/language';
import { useSafeTransactionProposalContext } from '../../../../provider/safe-transaction-proposal';
import { localization } from './localization';
import { SafeTransactionProposalView } from './view';

interface SafeTransactionProposalQueryProps {
  wallets: IWallet[];
  executor?: ISignerWallet;
  signer?: ISignerWallet;
  signers: ISignerWallet[];
  onApprove: (
    safeInfo: SafeInfoResponse,
    proposal: SafeTransactionProposalWithNonce,
  ) => Promise<void>;
  onReject: VoidFunction;
  onDelete: VoidPromiseFunction;
  onUpdateNonce: (nonce: number) => Promise<void>;
  onSelectSigner: (signer: ISignerWallet | undefined) => void;
  onSelectExecutor: (executor: ISignerWallet) => void;
  onChangeGasData: (gasLevel: GasPriceLevel, gasLimits: bigint[]) => void;
  onOptionsPress: VoidFunction;
  onSelectSignerPress: VoidFunction;
  onSelectExecutorPress: VoidFunction;
}

export function SafeTransactionProposalWithQuery(
  props: SafeTransactionProposalQueryProps,
) {
  const { proposal, safeInfo, contacts, isDapp, nonceData, executors } =
    useSafeTransactionProposalContext();
  const { language } = useLanguageContext();

  return onLoadable(composeLoadables(safeInfo, nonceData)(tuple))(
    () => (
      <View className='flex h-full items-center justify-center'>
        <ActivityIndicator />
      </View>
    ),
    () => (
      <ErrorScreen
        title={localization.unableToGetSafeInfo[language]}
        description={localization.somethingWentWrong[language]}
      />
    ),
    ([safeInfo, nonceData]) => (
      <SafeTransactionProposalWithSafeInfo
        {...props}
        proposal={proposal}
        safeInfo={safeInfo}
        contacts={contacts}
        nonceData={nonceData}
        executors={executors}
        isDapp={isDapp}
      />
    ),
  );
}

function SafeTransactionProposalWithSafeInfo(
  props: SafeTransactionProposalQueryProps & {
    proposal: ISafeTransactionProposal;
    safeInfo: SafeInfoResponse;
    nonceData: SafeNonceData;
    executors: IWalletWithLoadableBalance[];
    contacts: Loadable<IContact[]>;
    isDapp: boolean;
  },
) {
  const {
    executor,
    proposal,
    safeInfo,
    contacts,
    nonceData,
    executors,
    isDapp,
  } = props;

  const state = getSafeTxStateFromSafeTransactionProposal(safeInfo, proposal);
  const isExecutable =
    state === SafeTxState.ReadyToExecute || state === SafeTxState.Executing;
  const isNextNonce = proposal.safeNonce === safeInfo.nonce;
  const isEnabled = !proposal.isRelayed && isExecutable && isNextNonce;

  const encodedTx = loadDataFromQuery(
    useEncodeTransactionProposalQuery(
      proposal as SafeTransactionProposalWithNonce,
      { enabled: isEnabled },
    ),
  );
  const gasLimit = loadDataFromQuery(
    useEstimateGasLimitForSafeTransactionProposalQuery(
      proposal as SafeTransactionProposalWithNonce,
      encodedTx,
      proposal.chainId === ChainId.ZkSync ? executor : undefined,
      {
        enabled:
          isEnabled &&
          ((proposal.chainId === ChainId.ZkSync && !!executor) ||
            proposal.chainId !== ChainId.ZkSync),
      },
    ),
  );
  // TODO: there is no need to fetch gas price for relayed tx, can just
  // fetch native token price instead
  const feeDataQuery = useFeeDataQuery(
    { input: { chainId: proposal.chainId, data: encodedTx.data! } },
    {
      enabled: isEnabled && encodedTx.success && !!encodedTx.data,
      refetchInterval:
        !proposal.isRelayed && isExecutable ? 1000 * 10 : undefined,
    },
  );
  const feeData = loadDataFromQuery(
    feeDataQuery,
    (data) => data.feeData as IFeeData,
  );

  const simulationQuery = useSimulateSafeTransactionProposal(proposal, {
    enabled: !isSafeTransactionProposalComplete(proposal),
  });
  const simulatedEvents = loadDataFromQuery(
    simulationQuery,
    (data) => data.transactionSimulation as ITransactionEvents,
  );

  return (
    <SafeTransactionProposalView
      {...props}
      proposal={proposal}
      safeInfo={safeInfo}
      contacts={contacts}
      nonceData={nonceData}
      simulatedEvents={simulatedEvents}
      gasLimit={gasLimit}
      feeData={feeData}
      executors={executors}
      isDapp={isDapp}
    />
  );
}
