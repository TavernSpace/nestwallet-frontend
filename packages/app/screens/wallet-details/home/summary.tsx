import cn from 'classnames';
import { Platform } from 'react-native';
import { formatMoney, formatPercentage } from '../../../common/format/number';
import { Loadable, Preferences } from '../../../common/types';
import { tuple } from '../../../common/utils/functions';
import {
  composeLoadables,
  loadDataFromQuery,
  makeLoadable,
  onLoadable,
} from '../../../common/utils/query';
import { BaseButton } from '../../../components/button/base-button';
import { Skeleton, TextSkeleton } from '../../../components/skeleton';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { isSupportedChain } from '../../../features/chain';
import { visibilityFilter } from '../../../features/crypto/visibility';
import { useDimensions } from '../../../features/dimensions';
import {
  IBlockchainType,
  ICryptoBalance,
  ICryptoPositionInputType,
  IOrder,
  IOrderFilter,
  IOrderInputType,
  IWallet,
  useCryptoPositionsQuery,
  useOrdersQuery,
} from '../../../graphql/client/generated/graphql';
import { totalBalanceFromCrypto, totalPNLFromCrypto } from '../utils';
import { WalletActionSection } from './action';

export function WalletSummaryWithQuery(props: {
  wallet: IWallet;
  viewOnly: boolean;
  preferences: Loadable<Preferences>;
  onChangePreferences: (input: Preferences) => Promise<void>;
  onReceivePress: VoidFunction;
  onSendPress: VoidFunction;
  onSwapPress: VoidFunction;
}) {
  const {
    wallet,
    viewOnly,
    preferences,
    onChangePreferences,
    onReceivePress,
    onSendPress,
    onSwapPress,
  } = props;
  const { width } = useDimensions();

  const cryptoPositionsQuery = useCryptoPositionsQuery(
    { input: { walletId: wallet.id, type: ICryptoPositionInputType.All } },
    { staleTime: Infinity },
  );
  const cryptoPositions = loadDataFromQuery(cryptoPositionsQuery, (data) =>
    data.cryptoPositions.edges
      .filter(
        (balance) =>
          isSupportedChain(balance.node.chainId) &&
          visibilityFilter(balance.node),
      )
      .map((edge) => edge.node as ICryptoBalance),
  );

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
      staleTime: Infinity,
    },
  );
  const orders =
    wallet.blockchain === IBlockchainType.Svm
      ? loadDataFromQuery(ordersQuery, (data) =>
          data.orders.edges.map((edge) => edge.node as IOrder),
        )
      : makeLoadable<IOrder[]>([]);

  const balance = composeLoadables(
    cryptoPositions,
    preferences,
    orders,
  )((balances, preferences, orders) =>
    // TODO: add PnL for Solana
    preferences.profitLoss === 'daily'
      ? totalBalanceFromCrypto(balances, orders)
      : totalPNLFromCrypto(balances, orders),
  );

  const dependent = Platform.OS === 'ios';

  return (
    <View className='w-full'>
      {onLoadable(preferences)(
        () => null,
        () => null,
        (preferences) => (
          <View className='flex w-full flex-row items-center justify-center'>
            {onLoadable(composeLoadables(cryptoPositions, balance)(tuple))(
              () => (
                <View className='flex flex-col items-center space-y-2'>
                  <Skeleton width={120} height={40} borderRadius={8} />
                  <Skeleton width={90} height={30} borderRadius={8} />
                  {dependent && (
                    <View className='mb-1 flex flex-row space-x-2'>
                      <Skeleton
                        width={(width - 40) / 2}
                        height={40}
                        borderRadius={12}
                      />
                      <Skeleton
                        width={(width - 40) / 2}
                        height={40}
                        borderRadius={12}
                      />
                    </View>
                  )}
                </View>
              ),
              () => (
                <View className='flex w-full flex-col'>
                  <ValueSection
                    preferences={preferences}
                    amount={0}
                    absoluteChange={0}
                    percentageChange={0}
                    onChangePreferences={onChangePreferences}
                  />
                  {dependent && (
                    <View className='pt-1.5'>
                      <WalletActionSection
                        wallet={wallet}
                        viewOnly={true}
                        onSendPress={onSendPress}
                        onReceivePress={onReceivePress}
                      />
                    </View>
                  )}
                </View>
              ),
              ([positions, { balance, absoluteChange, percentageChange }]) => (
                <View className='flex w-full flex-col'>
                  <ValueSection
                    preferences={preferences}
                    amount={balance}
                    absoluteChange={absoluteChange}
                    percentageChange={percentageChange}
                    onChangePreferences={onChangePreferences}
                  />
                  {dependent && (
                    <View className='pt-1.5'>
                      <WalletActionSection
                        wallet={wallet}
                        viewOnly={positions.length === 0 || viewOnly}
                        onSendPress={onSendPress}
                        onReceivePress={onReceivePress}
                        onSwapPress={onSwapPress}
                      />
                    </View>
                  )}
                </View>
              ),
            )}
          </View>
        ),
      )}
      {!dependent && (
        <View className='pt-2'>
          <WalletActionSection
            wallet={wallet}
            viewOnly={viewOnly}
            onSendPress={onSendPress}
            onReceivePress={onReceivePress}
            onSwapPress={onSwapPress}
          />
        </View>
      )}
    </View>
  );
}

function ValueSection(props: {
  preferences: Preferences;
  amount: number;
  absoluteChange: number;
  percentageChange: number;
  onChangePreferences: (input: Preferences) => Promise<void>;
}) {
  const {
    preferences,
    amount,
    absoluteChange,
    percentageChange,
    onChangePreferences,
  } = props;

  const handleStealthToggle = async (preferences: Preferences) => {
    const updatedPreferences: Preferences = {
      ...preferences,
      stealthMode: !preferences.stealthMode,
    };
    await onChangePreferences(updatedPreferences);
  };

  return (
    <View className='flex flex-col items-center justify-center space-y-1 px-4'>
      <View className='flex flex-row items-center'>
        <BaseButton onPress={() => handleStealthToggle(preferences)}>
          {preferences.stealthMode ? (
            <View className='flex h-10 flex-row items-center'>
              <TextSkeleton
                className='text-text-primary text-4xl font-medium tracking-tighter'
                text='﹡﹡﹡﹡﹡'
                delayBetweenIterationsAmount={2000}
              />
            </View>
          ) : (
            <Text
              className='text-text-primary truncate text-4xl font-medium'
              numberOfLines={1}
            >
              {formatMoney(amount)}
            </Text>
          )}
        </BaseButton>
      </View>
      <View className='flex flex-row items-center'>
        <View className='flex flex-row items-center'>
          <BaseButton onPress={() => handleStealthToggle(preferences)}>
            <View
              className={cn(
                'items-center justify-center rounded-lg px-2 py-0.5',
                {
                  'bg-success/10': percentageChange >= 0,
                  'bg-failure/10': percentageChange < 0,
                },
              )}
            >
              <Text
                className={cn('truncate text-base font-medium tracking-tight', {
                  'text-success': percentageChange >= 0,
                  'text-failure': percentageChange < 0,
                })}
                numberOfLines={1}
              >
                {preferences.stealthMode
                  ? `${percentageChange < 0 ? '-' : ''}${formatPercentage(
                      Math.abs(percentageChange * 100),
                    )}`
                  : `${percentageChange >= 0 ? '+' : '-'}${formatMoney(
                      Math.abs(absoluteChange),
                    )} (${formatPercentage(Math.abs(percentageChange * 100))})`}
              </Text>
            </View>
          </BaseButton>
        </View>
      </View>
    </View>
  );
}
