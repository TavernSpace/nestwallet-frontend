import {
  faCapsules,
  faClone,
  faMoonStars,
  faShieldCheck,
  faShieldExclamation,
  faShieldHalved,
  faShieldXmark,
  faSquare4,
  faSquareCheck,
  faSquareExclamation,
} from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { formatAddress } from '../../common/format/address';
import { formatNumber, formatPercentage } from '../../common/format/number';
import { NumberType } from '../../common/format/types';
import { linkToBlockchainExplorer } from '../../common/hooks/link';
import { opacity } from '../../common/utils/functions';
import { adjust, withSize } from '../../common/utils/style';
import { Banner } from '../../components/banner';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Skeleton } from '../../components/skeleton';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { useAudioContext } from '../../provider/audio';
import { SecurityDisplayType } from './types';
import { Risk, getRiskScoreProperties, getTopHoldersColor } from './utils';

export function SecurityReportPill(props: {
  risks: Risk[];
  score: number;
  displayType: SecurityDisplayType;
  type?: 'moonshot' | 'pump' | 'fourmeme' | 'default';
  marketCap?: number;
  handlePress: () => void;
}) {
  const {
    risks,
    score,
    type = 'default',
    displayType,
    marketCap,
    handlePress,
  } = props;
  const { pressSound } = useAudioContext().sounds;

  const { color } =
    type === 'default'
      ? getRiskScoreProperties(score)
      : {
          color:
            type === 'moonshot'
              ? colors.moonshot
              : type === 'pump'
              ? colors.pumpfun
              : colors.fourmeme,
        };
  const iconSize = adjust(
    type === 'moonshot' || type === 'pump' || type === 'fourmeme' ? 18 : 16,
    2,
  );
  const low = score <= 300;
  const medium = score <= 600;

  return displayType === 'banner' ? (
    <View className='flex flex-col space-y-2'>
      <View className='flex flex-row items-center space-x-2'>
        <BaseButton
          className='flex-1'
          pressSound={pressSound}
          onPress={handlePress}
        >
          <View
            className='flex flex-col items-center justify-between rounded-xl py-2'
            style={{ backgroundColor: opacity(color, 10) }}
          >
            <View className='flex w-full flex-row items-center justify-between px-3'>
              <FontAwesomeIcon
                icon={
                  type === 'moonshot'
                    ? faMoonStars
                    : type === 'pump'
                    ? faCapsules
                    : type === 'fourmeme'
                    ? faSquare4
                    : low
                    ? faShieldCheck
                    : medium
                    ? faShieldExclamation
                    : faShieldXmark
                }
                color={color}
                size={iconSize}
              />
              <Text className='text-sm font-medium' style={{ color }}>
                {type === 'moonshot'
                  ? 'Moonshot'
                  : type === 'pump'
                  ? 'Pump.fun'
                  : type === 'fourmeme'
                  ? 'Four.meme'
                  : score <= 300
                  ? 'Low Risk'
                  : score <= 600
                  ? 'Medium Risk'
                  : 'High Risk'}
              </Text>
              <View style={withSize(iconSize)} />
            </View>
          </View>
        </BaseButton>
      </View>
    </View>
  ) : (
    <SecurityListItem
      state={low ? 'low' : medium ? 'medium' : 'danger'}
      type={type}
      onPress={handlePress}
    />
  );
}

export function SecurityReportPillError() {
  return (
    <View className='px-4'>
      <View
        className='bg-card w-full items-center justify-center rounded-2xl'
        style={{ height: 198 + adjust(40, 40) }}
      >
        <View className='bg-warning/10 h-12 w-12 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faShieldXmark}
            size={24}
            color={colors.warning}
          />
        </View>
        <View className='mt-3 flex flex-col items-center justify-center'>
          <Text className='text-text-primary text-sm font-medium'>
            {'Security report not available'}
          </Text>
          <Text className='text-text-secondary text-xs font-normal'>
            {'Could not find any security data for this token.'}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SecurityListItem(props: {
  state: 'danger' | 'medium' | 'low' | 'error';
  type: 'moonshot' | 'pump' | 'fourmeme' | 'default';
  onPress?: VoidFunction;
}) {
  const { state, type, onPress } = props;

  return (
    <BaseButton onPress={onPress} disabled={state === 'error'}>
      <View className='flex flex-row items-center justify-between'>
        <View className='flex flex-row items-center space-x-2'>
          <View
            className='items-center justify-center rounded-full'
            style={withSize(adjust(16, 2))}
          >
            <FontAwesomeIcon
              icon={faShieldHalved}
              size={adjust(12, 2)}
              color={colors.textSecondary}
            />
          </View>
          <Text className='text-text-secondary text-xs font-medium'>
            {'Security'}
          </Text>
        </View>
        <View className='flex flex-row items-center space-x-2'>
          {type !== 'default' && (
            <View
              className='rounded-full px-2 py-1'
              style={{
                backgroundColor: opacity(
                  type === 'moonshot'
                    ? colors.moonshot
                    : type === 'pump'
                    ? colors.pumpfun
                    : colors.fourmeme,
                  10,
                ),
              }}
            >
              <Text
                className='text-xs font-normal'
                style={{
                  color:
                    type === 'moonshot'
                      ? colors.moonshot
                      : type === 'pump'
                      ? colors.pumpfun
                      : colors.fourmeme,
                }}
              >
                {type === 'moonshot'
                  ? 'Moonshot'
                  : type === 'pump'
                  ? 'Pump.fun'
                  : 'Four.meme'}
              </Text>
            </View>
          )}
          <View
            className={cn('rounded-full px-2 py-1', {
              'bg-success/10': state === 'low',
              'bg-warning/10': state === 'medium' || state === 'error',
              'bg-failure/10': state === 'danger',
            })}
          >
            <Text
              className={cn('text-xs font-normal', {
                'text-success': state === 'low',
                'text-warning': state === 'medium' || state === 'error',
                'text-failure': state === 'danger',
              })}
            >
              {state === 'low'
                ? 'Low Risk'
                : state === 'medium'
                ? 'Medium Risk'
                : state === 'danger'
                ? 'High Risk'
                : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>
    </BaseButton>
  );
}

export function SecuritySkeleton() {
  return (
    <View className='flex flex-col space-y-3 px-4'>
      <Skeleton width={'100%'} height={adjust(120)} borderRadius={16} />
      <Skeleton width={'100%'} height={adjust(120)} borderRadius={16} />
      <Skeleton width={'100%'} height={adjust(120)} borderRadius={16} />
    </View>
  );
}

export const TokenInfo = styled(function (props: {
  header: string;
  info?: string;
  onPress?: VoidFunction;
  style?: StyleProp<ViewStyle>;
}) {
  const { header, info, onPress, style } = props;

  return (
    <View
      className='flex w-full flex-row items-center justify-between py-1'
      style={style}
    >
      <View className='flex flex-1'>
        <Text className='text-text-secondary flex-1 text-sm font-normal'>
          {header}
        </Text>
      </View>
      <View className='flex flex-1 items-end justify-end'>
        <BaseButton onPress={onPress}>
          <View className='flex flex-row items-center space-x-2'>
            {onPress && (
              <FontAwesomeIcon
                icon={faClone}
                size={adjust(12, 2)}
                color={colors.textSecondary}
              />
            )}
            <Text className='text-text-primary text-end text-sm font-normal'>
              {info ?? '-'}
            </Text>
          </View>
        </BaseButton>
      </View>
    </View>
  );
});

export const ReportBanner = styled(function (props: {
  title: string;
  body: string;
  score: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { title, body, score, style } = props;

  const { color } = getRiskScoreProperties(score, true);

  return (
    <Banner
      title={title}
      body={body}
      icon={score === 0 ? faSquareCheck : faSquareExclamation}
      color={color}
      borderRadius={8}
      style={style}
    />
  );
});

export const RiskPill = styled(function (props: {
  score: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { score, style } = props;
  const { color, icon } = getRiskScoreProperties(score);
  const risk =
    score <= 300
      ? 'Low Risks'
      : score <= 600
      ? 'Moderate Risks'
      : 'Dangerous Risks';

  return <Banner title={risk} icon={icon} color={color} style={style} />;
});

export const Holder = styled(function (props: {
  accountAddress: string;
  chainId: number;
  amount: number;
  percentage: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { accountAddress, chainId, amount, percentage, style } = props;

  const color = getTopHoldersColor(percentage);
  const textColor = color ?? colors.textPrimary;

  return (
    <View style={style}>
      <View className='flex w-full flex-row items-center justify-center rounded-lg px-3 py-2'>
        <BaseButton
          className='flex-1'
          onPress={() =>
            linkToBlockchainExplorer(chainId, {
              type: 'address',
              data: accountAddress,
            })
          }
        >
          <Text
            className='flex-1 text-left text-xs font-normal'
            style={{ color: textColor }}
          >
            {formatAddress(accountAddress, true)}
          </Text>
        </BaseButton>
        <Text
          className='flex-1 text-center text-xs font-normal'
          style={{ color: textColor }}
        >
          {formatNumber({ input: amount, type: NumberType.TokenTx })}
        </Text>
        <Text
          className='flex-1 text-right text-xs font-normal'
          style={{ color: textColor }}
        >
          {formatPercentage(percentage)}
        </Text>
      </View>
    </View>
  );
});
