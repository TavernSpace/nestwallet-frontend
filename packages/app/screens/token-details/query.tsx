import { useMemo } from 'react';
import {
  loadDataFromQuery,
  makeLoadable,
  onLoadable,
  useLoadDataFromQuery,
} from '../../common/utils/query';
import { CardErrorState } from '../../components/card/card-empty-state';
import { View } from '../../components/view';
import { ChainId, isSupportedChain } from '../../features/chain';
import { isSimpleBalance } from '../../features/crypto/balance';
import { useDimensions } from '../../features/dimensions';
import { useSafeAreaInsets } from '../../features/safe-area';
import { useSvmTokenTypeQuery } from '../../features/swap/utils';
import {
  IBlockchainType,
  ICryptoBalance,
  ICryptoPositionInputType,
  IOrder,
  IOrderFilter,
  IOrderInputType,
  ITokenMarketDataV2,
  ITransaction,
  IUser,
  IWallet,
  useCryptoPositionsQuery,
  useFavoriteTokensQuery,
  useOrdersQuery,
  useTokenMarketDataV2Query,
  useUpsertFavoriteTokenMutation,
} from '../../graphql/client/generated/graphql';
import { TokenDetailsLoadingScreen } from './empty';
import { TokenDetails } from './screen';

interface TokenDetailsQueryProps {
  user: IUser;
  wallet: IWallet;
  token: ICryptoBalance;
  hideActions: boolean;
  offset?: number;
  onPressShare: (viewRef: React.MutableRefObject<null>) => Promise<void>;
  onPressSend: (token: ICryptoBalance) => void;
  onPressSwap: (token: ICryptoBalance, buy: boolean) => void;
  onPressTransaction: (transaction: ITransaction) => void;
  onBack: VoidFunction;
}

export function TokenDetailsWithQuery(props: TokenDetailsQueryProps) {
  const { wallet, token, offset = 0 } = props;
  const { height } = useDimensions();
  const { top } = useSafeAreaInsets();

  const cryptoPositionsQuery = useCryptoPositionsQuery(
    { input: { walletId: wallet.id, type: ICryptoPositionInputType.All } },
    { staleTime: Infinity },
  );
  const cryptoPositions = useLoadDataFromQuery(
    cryptoPositionsQuery,
    (data) =>
      data.cryptoPositions.edges
        .filter(
          (balance) =>
            isSupportedChain(balance.node.chainId) &&
            balance.node.address === token.address &&
            balance.node.chainId === token.chainId,
        )
        .map((edge) => edge.node as ICryptoBalance),
    [token],
  );

  return onLoadable(cryptoPositions)(
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
    (positions) => (
      <TokenDetailsWithPositions {...props} cryptoPositions={positions} />
    ),
  );
}

function TokenDetailsWithPositions(
  props: TokenDetailsQueryProps & { cryptoPositions: ICryptoBalance[] },
) {
  const { wallet, token, cryptoPositions } = props;

  const toggleFavoriteTokenMutation = useUpsertFavoriteTokenMutation();

  const ordersQuery = useOrdersQuery(
    {
      input: {
        walletId: wallet.id,
        type: IOrderInputType.All,
        filter: IOrderFilter.Pending,
      },
    },
    {
      enabled: wallet.blockchain === IBlockchainType.Svm,
      staleTime: 30 * 1000,
    },
  );
  const orders =
    wallet.blockchain === IBlockchainType.Svm
      ? loadDataFromQuery(ordersQuery, (data) =>
          data.orders.edges
            .map((edge) => edge.node as IOrder)
            .filter(
              (order) =>
                !!order.limitOrder &&
                order.limitOrder.fromToken.address === token.address,
            ),
        )
      : makeLoadable<IOrder[]>([]);

  const tokenDataQuery = useTokenMarketDataV2Query(
    {
      input: {
        chainId: token.chainId,
        address: token.address,
        id: token.tokenMetadata.id,
      },
    },
    { staleTime: 15 * 1000 },
  );
  const tokenData = loadDataFromQuery(
    tokenDataQuery,
    (data) => data.tokenMarketDataV2 as ITokenMarketDataV2,
  );

  const tokenTypeQuery = useSvmTokenTypeQuery(token, {
    staleTime: 60 * 1000,
    enabled: token.chainId === ChainId.Solana,
  });
  const tokenType = loadDataFromQuery(tokenTypeQuery);

  const augmentedToken = useMemo(() => {
    const spendable = cryptoPositions.find((position) =>
      isSimpleBalance(position),
    );
    return spendable ?? token;
  }, [cryptoPositions, token]);

  const favoriteTokensQuery = useFavoriteTokensQuery(
    { blockchain: wallet.blockchain },
    { staleTime: Infinity },
  );
  const favorite = loadDataFromQuery(favoriteTokensQuery, (data) =>
    data.favoriteTokens.some(
      ({ address, chainId }) =>
        address === token.address && chainId === token.chainId,
    ),
  );

  const handleFavoritePress = async (favorite: boolean) => {
    await toggleFavoriteTokenMutation.mutateAsync({
      input: { address: token.address, chainId: token.chainId, favorite },
    });
    await favoriteTokensQuery.refetch();
  };

  return (
    <TokenDetails
      {...props}
      token={augmentedToken}
      tokenData={tokenData}
      tokenType={tokenType}
      relevantTokens={cryptoPositions}
      orders={orders}
      favorite={favorite}
      onPressFavorite={handleFavoritePress}
    />
  );
}
