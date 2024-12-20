import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import {
  loadDataFromQuery,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  IOrganization,
  ITransaction,
  IWallet,
  useTransactionQuery,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ErrorScreen } from '@nestwallet/app/molecules/error/screen';
import { TransactionDetailScreenWithQuery } from '@nestwallet/app/screens/transaction-detail/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useOrganizationById } from '../../../hooks/organization';
import { useWalletById } from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<AppStackParamList, 'transaction'>;

function isTransaction(tx: ITransaction | string): tx is ITransaction {
  return typeof tx !== 'string';
}

export const TransactionDetailScreenWithData = withUserContext(
  _TransactionDetailScreenWithData,
);

function _TransactionDetailScreenWithData({ route }: RouteProps) {
  const { transaction, walletId } = route.params;
  const { wallet } = useWalletById(walletId);
  const { organization } = useOrganizationById(wallet?.organization.id);
  useResetToOnInvalid('app', !wallet || !organization);

  return wallet && organization ? (
    isTransaction(transaction) ? (
      <TransactionDetailPrefetched
        transaction={transaction}
        wallet={wallet}
        organization={organization}
      />
    ) : (
      <TransactionDetailRequiresQuery
        txId={transaction}
        wallet={wallet}
        organization={organization}
      />
    )
  ) : null;
}

function TransactionDetailPrefetched(props: {
  transaction: ITransaction;
  wallet: IWallet;
  organization: IOrganization;
}) {
  const { transaction, wallet, organization } = props;
  const { wallets } = useUserContext();

  return (
    <TransactionDetailScreenWithQuery
      transaction={transaction}
      organization={organization}
      wallets={wallets}
      wallet={wallet}
    />
  );
}

function TransactionDetailRequiresQuery(props: {
  txId: string;
  wallet: IWallet;
  organization: IOrganization;
}) {
  const { txId, wallet, organization } = props;
  const { wallets } = useUserContext();

  const transactionQuery = useTransactionQuery({
    input: { txId, walletId: wallet.id },
  });
  const transaction = loadDataFromQuery(
    transactionQuery,
    (data) => data.transaction as ITransaction,
  );

  return onLoadable(transaction)(
    () => null,
    () => (
      <ErrorScreen
        title='Unable to get Transaction'
        description='Something went wrong trying to get this transaction.'
      />
    ),
    (transaction) => (
      <TransactionDetailScreenWithQuery
        transaction={transaction}
        organization={organization}
        wallets={wallets}
        wallet={wallet}
      />
    ),
  );
}
