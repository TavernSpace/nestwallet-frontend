import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { IWalletType } from '@nestwallet/app/graphql/client/generated/graphql';
import { StackScreenProps } from '@react-navigation/stack';
import { useOrganizationById } from '../../../../hooks/organization';
import { useWalletById } from '../../../../hooks/wallet';
import { WalletStackParamList } from '../../../../navigation/types';
import { withUserContext } from '../../../../provider/user/wrapper';
import { EoaTransferReviewWithData } from './external';
import { SafeTransferReviewWithData } from './safe';

type RouteProps = StackScreenProps<WalletStackParamList, 'transferReview'>;

export const TransferReviewWithData = withUserContext(_TransferReviewWithData);

function _TransferReviewWithData({ route }: RouteProps) {
  const { transfers, walletId, isRedirectedFromPopup = false } = route.params;
  const { wallet } = useWalletById(walletId);
  const { organization } = useOrganizationById(wallet?.organization.id);
  useResetToOnInvalid(
    'app',
    !wallet ||
      !organization ||
      (wallet.type !== IWalletType.Safe && transfers.length !== 1),
  );

  return !wallet || !organization ? null : wallet.type === IWalletType.Safe ? (
    <SafeTransferReviewWithData
      wallet={wallet}
      transfers={transfers}
      organization={organization}
    />
  ) : transfers.length === 1 ? (
    <EoaTransferReviewWithData
      wallet={wallet}
      transfer={transfers[0]!}
      organization={organization}
      isRedirectedFromPopup={isRedirectedFromPopup}
    />
  ) : null;
}
