import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { Holder as HolderType } from '../../common/api/goplus/types';
import { TopHolder } from '../../common/api/rugcheck/types';
import { formatAddress } from '../../common/format/address';
import { formatPercentage } from '../../common/format/number';
import { useCopy } from '../../common/hooks/copy';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import {
  IBlockchainType,
  ICryptoBalance,
} from '../../graphql/client/generated/graphql';
import { Holder, ReportBanner, TokenInfo } from './components';
import {
  Risk,
  calculateEvmTopHoldersPercentage,
  calculateSvmTopHoldersPercentage,
} from './utils';

export const RiskAnalysisCard = styled(function (props: {
  score: number;
  risks: Risk[];
  style?: StyleProp<ViewStyle>;
}) {
  const { score, risks, style } = props;

  return (
    <View className='bg-card flex flex-col rounded-2xl px-4 py-3' style={style}>
      <View className='flex flex-row items-center justify-between'>
        <Text className='text-text-primary text-base font-medium'>
          {'Risk Analysis'}
        </Text>
      </View>
      {risks.length > 0 ? (
        <View className='mt-4 space-y-2'>
          {risks.map((risk) => (
            <ReportBanner
              key={risk.name}
              title={risk.name}
              body={risk.description}
              score={risk.score}
            />
          ))}
        </View>
      ) : (
        <ReportBanner
          className='mt-2'
          title={'No Risks Found'}
          body={
            'No risks were found for this token. This does not mean this token is a safe investment.'
          }
          score={0}
        />
      )}
    </View>
  );
});

export const TopHolderCard = styled(function (props: {
  holders: (HolderType | TopHolder)[];
  chainId: number;
  blockchain: IBlockchainType;
  style?: StyleProp<ViewStyle>;
}) {
  const { holders, chainId, blockchain, style } = props;

  const topHoldersPercentage =
    blockchain === IBlockchainType.Svm
      ? calculateSvmTopHoldersPercentage(holders as TopHolder[])
      : calculateEvmTopHoldersPercentage(holders as HolderType[]);
  const validHolders = holders.slice(0, Math.min(5, holders.length));
  const dangerousHolders = validHolders.filter((holder) => {
    const percentage =
      'balance' in holder ? parseFloat(holder.percent) * 100 : holder.pct;
    return percentage >= 30;
  });
  const moderateHolders = validHolders.filter((holder) => {
    const percentage =
      'balance' in holder ? parseFloat(holder.percent) * 100 : holder.pct;
    return percentage < 30 && percentage >= 10;
  });
  const lowHolders = validHolders.filter((holder) => {
    const percentage =
      'balance' in holder ? parseFloat(holder.percent) * 100 : holder.pct;
    return percentage < 10;
  });

  return (
    <View className='bg-card flex flex-col rounded-2xl px-4 py-3' style={style}>
      <View className='flex flex-row items-center justify-between'>
        <Text className='text-text-primary text-base font-medium'>
          {'Top Holders'}
        </Text>
        <View
          className={cn('rounded-full px-2 py-0.5', {
            'bg-success/10': topHoldersPercentage < 15,
            'bg-warning/10':
              topHoldersPercentage >= 15 && topHoldersPercentage <= 30,
            'bg-failure/10': topHoldersPercentage > 30,
          })}
        >
          <Text
            className={cn('text-xs font-medium', {
              'text-success': topHoldersPercentage < 15,
              'text-warning':
                topHoldersPercentage >= 15 && topHoldersPercentage <= 30,
              'text-failure': topHoldersPercentage > 30,
            })}
          >
            {formatPercentage(topHoldersPercentage)}
          </Text>
        </View>
      </View>
      <View className='mt-3 w-full space-y-3'>
        <View className='flex w-full flex-row items-center justify-center rounded-full'>
          <Text className='text-text-secondary flex-1 text-xs font-medium'>
            {'Account'}
          </Text>
          <Text className='text-text-secondary flex-1 text-center text-xs font-medium'>
            {'Amount'}
          </Text>
          <Text className='text-text-secondary flex-1 text-right text-xs font-medium'>
            {'Percentage'}
          </Text>
        </View>
        <View className='flex flex-col space-y-1.5'>
          {dangerousHolders.length > 0 && (
            <View className='bg-failure/10 flex flex-col rounded-xl'>
              {dangerousHolders.map((holder) => (
                <Holder
                  key={holder.address}
                  accountAddress={holder.address}
                  chainId={chainId}
                  amount={parseFloat(
                    'balance' in holder
                      ? holder.balance
                      : holder.uiAmountString,
                  )}
                  percentage={
                    'balance' in holder
                      ? parseFloat(holder.percent) * 100
                      : holder.pct
                  }
                />
              ))}
            </View>
          )}
          {moderateHolders.length > 0 && (
            <View className='bg-warning/10 flex flex-col rounded-xl'>
              {moderateHolders.map((holder) => (
                <Holder
                  key={holder.address}
                  accountAddress={holder.address}
                  chainId={chainId}
                  amount={parseFloat(
                    'balance' in holder
                      ? holder.balance
                      : holder.uiAmountString,
                  )}
                  percentage={
                    'balance' in holder
                      ? parseFloat(holder.percent) * 100
                      : holder.pct
                  }
                />
              ))}
            </View>
          )}
          {lowHolders.length > 0 && (
            <View className='bg-card-highlight flex flex-col rounded-xl'>
              {lowHolders.map((holder) => (
                <Holder
                  key={holder.address}
                  accountAddress={holder.address}
                  chainId={chainId}
                  amount={parseFloat(
                    'balance' in holder
                      ? holder.balance
                      : holder.uiAmountString,
                  )}
                  percentage={
                    'balance' in holder
                      ? parseFloat(holder.percent) * 100
                      : holder.pct
                  }
                />
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

export const TokenOverviewCard = styled(function (props: {
  creator?: string;
  blockchain: IBlockchainType;
  mintAuthority?: string;
  marketCap: number;
  totalSupply?: string;
  lpLocked: number;
  token: ICryptoBalance;
  style?: StyleProp<ViewStyle>;
}) {
  const {
    creator,
    blockchain,
    mintAuthority,
    marketCap,
    totalSupply,
    lpLocked,
    token,
    style,
  } = props;
  const { copy: copyCreator } = useCopy('Copied creator address!');
  const { copy: copyMinter } = useCopy('Copied mint authority address!');

  return (
    <View className='bg-card flex flex-col rounded-2xl px-4 py-3' style={style}>
      <Text className='text-text-primary text-base font-medium'>
        {'Token Overview'}
      </Text>
      <View className='mt-2 flex w-full flex-col'>
        {!!creator && (
          <TokenInfo
            header='Creator'
            info={formatAddress(creator)}
            onPress={() => copyCreator(creator)}
          />
        )}
        <TokenInfo
          header='Mint Authority'
          info={mintAuthority ? formatAddress(mintAuthority) : 'None'}
          onPress={!mintAuthority ? undefined : () => copyMinter(mintAuthority)}
        />
        <TokenInfo
          header='LP Locked'
          info={formatPercentage(Math.min(lpLocked, 100))}
        />
      </View>
    </View>
  );
});
