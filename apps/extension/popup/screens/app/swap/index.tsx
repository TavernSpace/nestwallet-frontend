import {
  useResetToOnInvalid,
  useResetToRoutes,
} from '@nestwallet/app/common/hooks/navigation';
import { TradeSettings } from '@nestwallet/app/common/types';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ITransactionProposal } from '@nestwallet/app/graphql/client/generated/graphql';
import { SwapWithQuery } from '@nestwallet/app/screens/swap/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useGoBackOrClose } from '../../../hooks/navigation';
import { useTradeSettings } from '../../../hooks/ui-service';
import { useWalletById } from '../../../hooks/wallet';
import { WalletStackParamList } from '../../../navigation/types';
import { parsePayload } from '../../../navigation/utils';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<WalletStackParamList, 'swap'>;
type RouteParams = RouteProps['route']['params'];

export const SwapScreenWithData = withUserContext(_SwapScreenWithData);

function _SwapScreenWithData({ route }: RouteProps) {
  const { initialAsset, walletId } = parsePayload<RouteParams>(route.params);
  const { wallet } = useWalletById(walletId);
  const { walletService } = useAppContext();
  const { wallets, user } = useUserContext();
  const { client } = useLockContext();
  const resetToRoutes = useResetToRoutes();
  useResetToOnInvalid('app', !wallet);

  const { data: tradeSettings } = useTradeSettings();

  // if we were redirected here from popup, close tab when done
  const isRedirectedFromPopup = route.params.payload;
  const navigateBack = useGoBackOrClose(!isRedirectedFromPopup);

  const handleProposalCreated = (proposal: ITransactionProposal) => {
    const walletId = wallet!.id;
    resetToRoutes(1, [
      {
        screen: 'app',
        params: {
          screen: 'walletDetails',
          params: {
            walletId: walletId,
          },
        },
      },
      {
        screen: 'app',
        params: {
          screen: 'wallet',
          params: {
            screen: 'transactionProposal',
            params: {
              proposalId: proposal.id,
              walletId: walletId,
            },
          },
        },
      },
    ]);
  };

  const handleTradeSettingsChange = async (settings: TradeSettings) => {
    if (tradeSettings.success) {
      await walletService.setTradeSettings(settings);
    }
  };

  return wallet
    ? onLoadable(tradeSettings)(
        () => null,
        () => null,
        (tradeSettings) => (
          <SwapWithQuery
            user={user}
            wallet={wallet}
            wallets={wallets}
            tradeSettings={tradeSettings}
            initialAsset={initialAsset}
            walletService={client}
            onProposalCreated={handleProposalCreated}
            onSuccess={navigateBack}
            onTradeSettingsChange={handleTradeSettingsChange}
          />
        ),
      )
    : null;
}
