import {
  useNavigationOptions,
  useResetToOnInvalid,
  useResetToRoutes,
} from '@nestwallet/app/common/hooks/navigation';
import {
  TokenDetailSettings,
  TradeSettings,
} from '@nestwallet/app/common/types';
import { tuple } from '@nestwallet/app/common/utils/functions';
import {
  composeLoadables,
  makeLoadableError,
  onLoadable,
} from '@nestwallet/app/common/utils/query';
import {
  ICryptoBalance,
  ITransaction,
  ITransactionProposal,
  IWallet,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { ErrorScreen } from '@nestwallet/app/molecules/error/screen';
import { InjectionContextProvider } from '@nestwallet/app/provider/injection';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { QuickTradeWithQuery } from '@nestwallet/app/screens/quick-trade/query';
import { TokenHeaderLeft } from '@nestwallet/app/screens/token-details/header';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import * as Share from 'expo-sharing';
// eslint-disable-next-line
import { captureRef } from 'react-native-view-shot';
import { useSignerWallet } from '../../../hooks/signer';
import {
  useTokenDetailSettings,
  useTradeSettings,
  useWalletById,
} from '../../../hooks/wallet';
import { AppStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { userService } from '../../../provider/constants';
import { useUserContext } from '../../../provider/user';
import { withUserContext } from '../../../provider/user/wrapper';
import { MobileChart } from './chart';

type RouteProps = StackScreenProps<AppStackParamList, 'trade'>;

export const QuickTradeScreenWithData = withUserContext(
  _QuickTradeScreenWithData,
);

function _QuickTradeScreenWithData({ route, navigation }: RouteProps) {
  const { walletId, initialAsset } = route.params;
  const { wallet } = useWalletById(walletId);
  useResetToOnInvalid('app', !wallet);

  const handleBack = () => {
    navigation.goBack();
  };

  useNavigationOptions({
    headerLeft: () => (
      <TokenHeaderLeft
        primaryAsset={initialAsset}
        tokenType={makeLoadableError()}
        favorite={makeLoadableError()}
        onBack={handleBack}
      />
    ),
  });

  return wallet ? (
    <QuickTradeWithWallet
      wallet={wallet}
      initialAsset={initialAsset}
      onBack={handleBack}
    />
  ) : (
    <ErrorScreen
      title='No Wallets Found'
      description='Create or import a wallet into Nest Wallet in order to use Quick Trade.'
    />
  );
}

function QuickTradeWithWallet(props: {
  wallet: IWallet;
  initialAsset: ICryptoBalance;
  onBack: VoidFunction;
}) {
  const { wallet, initialAsset } = props;
  const { walletService } = useAppContext();
  const { user } = useUserContext();
  const { showSnackbar } = useSnackbar();
  const signer = useSignerWallet(wallet);
  const navigation = useNavigation();
  const resetToRoutes = useResetToRoutes();

  const { data: tradeSettings } = useTradeSettings();
  const { data: tokenDetailSettings } = useTokenDetailSettings();

  const handleTradeSettingsChange = async (settings: TradeSettings) => {
    await userService.setTradeSettings(settings);
  };

  const handleTokenSettingsChange = async (settings: TokenDetailSettings) => {
    await userService.setTokenDetailSettings(settings);
  };

  const handleTransactionPress = (transaction: ITransaction) => {
    navigation.navigate('app', {
      screen: 'transaction',
      params: {
        transaction,
        walletId: wallet!.id,
      },
    });
  };

  const handleSendPress = (token: ICryptoBalance) => {
    navigation.navigate('app', {
      screen: 'wallet',
      params: {
        screen: 'transferAsset',
        params: {
          walletId: wallet.id,
          initialAsset: token,
        },
      },
    });
  };

  const handleSafeExecute = async (
    wallet: IWallet,
    proposal: ITransactionProposal,
  ) => {
    const walletId = wallet.id;
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
              walletId: wallet.id,
            },
          },
        },
      },
    ]);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleShare = () => async (viewRef: React.MutableRefObject<null>) => {
    try {
      const uri = await captureRef(viewRef, {
        format: 'jpg',
        quality: 1,
      });
      await Share.shareAsync(uri);
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: 'Something went wrong trying to share, please try again',
      });
    }
  };

  return onLoadable(
    composeLoadables(tradeSettings, tokenDetailSettings)(tuple),
  )(
    () => null,
    () => null,
    ([tradeSettings, tokenDetailSettings]) => (
      <InjectionContextProvider
        injection={() => (
          <MobileChart
            initialChartType={tokenDetailSettings.chartType}
            onSettingsChange={handleTokenSettingsChange}
          />
        )}
        mutable={false}
      >
        <QuickTradeWithQuery
          user={user}
          wallet={signer}
          client={walletService}
          tradeSettings={tradeSettings}
          initialAsset={initialAsset}
          externalAsset={makeLoadableError()}
          onSafeExecute={handleSafeExecute}
          onTradeSettingsChange={handleTradeSettingsChange}
          onSendPress={handleSendPress}
          onShare={handleShare}
          onTransactionPress={handleTransactionPress}
          onBack={handleBack}
        />
      </InjectionContextProvider>
    ),
  );
}
