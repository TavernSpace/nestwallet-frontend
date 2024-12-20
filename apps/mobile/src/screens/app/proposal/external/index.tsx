import { ISignerWallet } from '@nestwallet/app/common/types';
import {
  onExternalTransactionProposal,
  tagExternalTransactionProposal,
} from '@nestwallet/app/features/proposal/utils';
import { ITransactionProposalType } from '@nestwallet/app/graphql/client/generated/graphql';
import { useEoaTransactionProposalContext } from '@nestwallet/app/provider/eoa-transaction-proposal';
import { useNestWallet } from '@nestwallet/app/provider/nestwallet';
import { EthKeyTransactionProposalWithQuery } from '@nestwallet/app/screens/proposal/evm-key/transaction/eth-key-query';
import { SvmKeyTransactionProposalWithQuery } from '@nestwallet/app/screens/proposal/evm-key/transaction/svm-key-query';
import { TvmKeyTransactionProposalWithQuery } from '@nestwallet/app/screens/proposal/evm-key/transaction/tvm-key-query';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../../../../provider/application';
import { useUserContext } from '../../../../provider/user';

interface EthKeyTransactionProposalWithDataProps {
  signer: ISignerWallet;
  transactionType: ITransactionProposalType;
}

export function EoaTransactionProposalWithData(
  props: EthKeyTransactionProposalWithDataProps,
) {
  const { signer, transactionType } = props;
  const { windowType } = useNestWallet();
  const { wallets } = useUserContext();
  const { walletService } = useAppContext();
  const { transaction } = useEoaTransactionProposalContext();
  const navigation = useNavigation();

  return onExternalTransactionProposal(
    tagExternalTransactionProposal(transaction, transactionType),
  )(
    (tx) => (
      <EthKeyTransactionProposalWithQuery
        signer={signer}
        transaction={tx}
        wallets={wallets}
        windowType={windowType}
        client={walletService}
        onDelete={navigation.goBack}
      />
    ),
    (tx) => (
      <SvmKeyTransactionProposalWithQuery
        signer={signer}
        transaction={tx}
        wallets={wallets}
        onDelete={navigation.goBack}
      />
    ),
    (tx) => (
      <TvmKeyTransactionProposalWithQuery
        signer={signer}
        transaction={tx}
        wallets={wallets}
        onDelete={navigation.goBack}
      />
    ),
  );
}
