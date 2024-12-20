import {
  useResetToOnInvalid,
  useResetToRoutes,
} from '@nestwallet/app/common/hooks/navigation';
import { TradeSettings } from '@nestwallet/app/common/types';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { ITransactionProposal } from '@nestwallet/app/graphql/client/generated/graphql';
import { SwapWithQuery } from '@nestwallet/app/screens/swap/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useTradeSettings, useWalletById } from '../../../hooks/wallet';
import { WalletStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLockContext } from '../../../provider/lock';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<WalletStackParamList, 'swap'>;

export const SwapScreenWithData = withUserContext(_SwapScreenWithData);

function _SwapScreenWithData({ route, navigation }: RouteProps) {
  const { initialAsset, walletId } = route.params;
  const { walletService, userService } = useAppContext();
  const { wallet } = useWalletById(walletId);
  const { wallets, user } = useUserContext();
  const { toggleAutoLock } = useLockContext();
  const resetToRoutes = useResetToRoutes();
  useResetToOnInvalid('app', !wallet);

  const { data: tradeSettings } = useTradeSettings();

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
          screen: 'transactionProposal',
          params: {
            proposalId: proposal.id,
            walletId: walletId,
          },
        },
      },
    ]);
  };

  const handleTradeSettingsChange = async (settings: TradeSettings) => {
    if (tradeSettings.success) {
      await userService.setTradeSettings(settings);
    }
  };

  useEffect(() => {
    return () => toggleAutoLock(true);
  }, []);

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
            walletService={walletService}
            onProposalCreated={handleProposalCreated}
            onSuccess={navigation.goBack}
            onToggleLock={
              Platform.OS === 'android' ? toggleAutoLock : undefined
            }
            onTradeSettingsChange={handleTradeSettingsChange}
          />
        ),
      )
    : null;
}
