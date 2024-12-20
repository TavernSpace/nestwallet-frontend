import { useState } from 'react';
import { Platform } from 'react-native';
import { useNavigationOptions } from '../../common/hooks/navigation';
import { Loadable } from '../../common/types';
import { onLoadable } from '../../common/utils/query';
import { BUTTON_HEIGHT } from '../../components/button/button';
import { CardErrorState } from '../../components/card/card-empty-state';
import { ScrollView } from '../../components/scroll';
import { View } from '../../components/view';
import { isSwapSupportedChain } from '../../features/chain';
import { isSimpleBalance } from '../../features/crypto/balance';
import { cryptoKey } from '../../features/crypto/utils';
import { useDimensions } from '../../features/dimensions';
import { useSafeAreaInsets } from '../../features/safe-area';
import { SvmTokenType } from '../../features/swap/types';
import {
  ICryptoBalance,
  IOrder,
  ITokenMarketDataV2,
  ITransaction,
  IUser,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';
import { useNestWallet } from '../../provider/nestwallet';
import { ActionSection } from './action';
import { DetailsSection } from './details';
import { TokenDetailsLoadingScreen } from './empty';
import { TokenHeaderLeft, TokenHeaderRight } from './header';
import { OverviewSection } from './overview';
import { SecuritySection } from './security';
import { TradesSection } from './trades';
import { TokenDetailDisplay } from './types';

interface TokenDetailsProps {
  user: IUser;
  wallet: IWallet;
  token: ICryptoBalance;
  hideActions: boolean;
  relevantTokens: ICryptoBalance[];
  tokenType: Loadable<SvmTokenType>;
  tokenData: Loadable<ITokenMarketDataV2>;
  orders: Loadable<IOrder[]>;
  favorite: Loadable<boolean>;
  offset?: number;
  onPressFavorite: (favourite: boolean) => Promise<void>;
  onPressShare: (viewRef: React.MutableRefObject<null>) => Promise<void>;
  onPressSend: (token: ICryptoBalance) => void;
  onPressSwap: (token: ICryptoBalance, buy: boolean) => void;
  onPressTransaction: (transaction: ITransaction) => void;
  onBack: VoidFunction;
}

export function TokenDetails(props: TokenDetailsProps) {
  const {
    user,
    wallet,
    token,
    hideActions,
    relevantTokens,
    tokenType,
    tokenData,
    orders,
    favorite,
    offset = 0,
    onPressFavorite,
    onPressShare,
    onPressSend,
    onPressSwap,
    onPressTransaction,
    onBack,
  } = props;
  const { windowType } = useNestWallet();
  const { top, bottom } = useSafeAreaInsets();
  const { height } = useDimensions();

  const [display, setDisplay] = useState<TokenDetailDisplay>('overview');

  // TODO: re-enable on iOS
  const swapDisabled =
    (Platform.OS === 'ios' && wallet.type === IWalletType.Safe) ||
    wallet.type === IWalletType.Trezor ||
    !isSwapSupportedChain(token.chainId);
  const sendableCount = relevantTokens.filter(
    (item) => isSimpleBalance(item) && cryptoKey(token) === cryptoKey(item),
  ).length;

  useNavigationOptions({
    headerLeft: () => (
      <TokenHeaderLeft
        primaryAsset={token}
        tokenType={tokenType}
        favorite={favorite}
        onFavoritePress={onPressFavorite}
        onBack={onBack}
      />
    ),
    headerRight: () => (
      <TokenHeaderRight
        display={display}
        onDisplayChange={(display) => setDisplay(display)}
      />
    ),
  });

  return onLoadable(orders)(
    () => <TokenDetailsLoadingScreen />,
    () => (
      <View
        className='absolute h-full w-full'
        style={{ marginTop: (height - offset - top) / 2 - 120 }}
      >
        <CardErrorState
          title='Unable to get Token Data'
          description={`Something went wrong trying to get this token's data.`}
        />
      </View>
    ),
    (orders) => (
      <View className='absolute h-full w-full'>
        <ScrollView
          style={
            windowType === 'sidepanel'
              ? {
                  maxHeight:
                    height -
                    56 -
                    (!hideActions && (sendableCount > 0 || !swapDisabled)
                      ? BUTTON_HEIGHT + 24
                      : 0),
                }
              : undefined
          }
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={display !== 'trades'}
          contentContainerStyle={{
            paddingTop: 8,
            paddingBottom:
              display === 'trades'
                ? 0
                : !hideActions && (sendableCount > 0 || !swapDisabled)
                ? 16 + offset
                : bottom + offset,
          }}
        >
          {display === 'overview' && (
            <OverviewSection token={token} tokenData={tokenData} />
          )}
          {display === 'trades' && (
            <TradesSection
              token={token}
              hideActions={hideActions || (sendableCount === 0 && swapDisabled)}
              offset={offset}
            />
          )}
          {display === 'details' && (
            <DetailsSection
              user={user}
              wallet={wallet}
              token={token}
              relevantTokens={relevantTokens}
              orders={orders}
              onSharePress={onPressShare}
              onTransactionPress={onPressTransaction}
            />
          )}
          {display === 'security' && <SecuritySection token={token} />}
        </ScrollView>
        {!hideActions && (sendableCount > 0 || !swapDisabled) && (
          <ActionSection
            token={token}
            swapDisabled={swapDisabled}
            sendableCount={sendableCount}
            onSendPress={onPressSend}
            onSwapPress={onPressSwap}
          />
        )}
      </View>
    ),
  );
}
