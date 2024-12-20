import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { walletTransactionProposalType } from '@nestwallet/app/features/proposal/utils';
import { ITransactionProposalType } from '@nestwallet/app/graphql/client/generated/graphql';
import { ErrorScreen } from '@nestwallet/app/molecules/error/screen';
import { EoaTransactionProposalContextProvider } from '@nestwallet/app/provider/eoa-transaction-proposal';
import { SafeTransactionProposalContextProvider } from '@nestwallet/app/provider/safe-transaction-proposal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSignerById } from '../../../hooks/signer';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';
import { EoaTransactionProposalWithData } from './external';
import { SafeTransactionProposalWithData } from './safe/transaction';

type RouteProps = NativeStackScreenProps<
  AppStackParamList,
  'transactionProposal'
>;

export const TransactionProposalWithData = withUserContext(
  _TransactionProposalWithData,
);

function _TransactionProposalWithData(props: RouteProps) {
  const { proposalId, walletId, dappData } = props.route.params;
  const { signers } = useUserContext();
  const { wallet } = useWalletById(walletId);
  const { signer } = useSignerById(walletId);
  useResetToOnInvalid('app', !wallet);

  const transactionType = wallet && walletTransactionProposalType(wallet);

  if (transactionType === ITransactionProposalType.Safe) {
    const validSigners = signers.filter((signer) => signer.hasKeyring);
    return (
      <SafeTransactionProposalContextProvider
        proposalId={proposalId}
        isDapp={!!dappData}
        signers={validSigners}
        errorElement={
          <ErrorScreen
            title='Unable to get Proposal'
            description='Something went wrong trying to get this proposal.'
          />
        }
      >
        <SafeTransactionProposalWithData dappData={dappData} />
      </SafeTransactionProposalContextProvider>
    );
  } else if (signer && transactionType) {
    return (
      <EoaTransactionProposalContextProvider
        transactionId={proposalId}
        transactionType={transactionType}
        isDapp={!!dappData}
        errorElement={
          <ErrorScreen
            title='Unable to get Transaction'
            description='Something went wrong trying to get this transaction.'
          />
        }
      >
        <EoaTransactionProposalWithData
          signer={signer}
          transactionType={transactionType}
        />
      </EoaTransactionProposalContextProvider>
    );
  } else {
    return null;
  }
}
