import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faChevronRight } from '@fortawesome/pro-regular-svg-icons';
import { faUser } from '@fortawesome/pro-solid-svg-icons';
import { styled } from 'nativewind';
import { ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import { formatNumber } from '../../../../common/format/number';
import { NumberType } from '../../../../common/format/types';
import { adjust } from '../../../../common/utils/style';
import { BaseButton } from '../../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Svg } from '../../../../components/svg';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';

interface ReferralRewardsCardProps {
  totalReferrals: number;
  totalXp: number;
  estimatedEarningsEvm: number;
  estimatedEarningsSvm: number;
  onMoreDetailsAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export const ReferralRewardsCard = (props: ReferralRewardsCardProps) => {
  const {
    totalReferrals,
    totalXp,
    estimatedEarningsEvm,
    estimatedEarningsSvm,
    onMoreDetailsAction,
    style,
  } = props;

  return (
    <BaseButton onPress={onMoreDetailsAction}>
      <View className='bg-card w-full space-y-2 rounded-2xl p-4' style={style}>
        {onMoreDetailsAction ? (
          <View className='flex flex-col space-y-2'>
            <View className='flex flex-row items-center justify-between'>
              <Text className='text-text-primary text-base font-medium'>
                Referral Rewards
              </Text>
              <FontAwesomeIcon
                icon={faChevronRight}
                color={colors.textSecondary}
                size={adjust(14, 2)}
              />
            </View>
            <View className='bg-card-highlight-secondary h-[1px]' />
          </View>
        ) : null}

        <View className='flex w-full flex-row space-x-3 py-1'>
          <IconItem
            icon={faUser}
            size={adjust(24, 2)}
            color={colors.success}
            label={totalReferrals + ''}
          />
          <SvgItem
            source={{
              uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/quest/referral/xp.svg',
            }}
            width={adjust(30, 2)}
            height={adjust(24, 2)}
            label={`${totalXp}`}
          />
          <SvgItem
            source={{
              uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/ethereum.svg',
            }}
            width={adjust(36, 2)}
            height={adjust(36, 2)}
            label={formatNumber({
              input: estimatedEarningsEvm,
              type: NumberType.TokenNonTx,
            })}
          />
          <SvgItem
            source={{
              uri: 'https://storage.googleapis.com/nestwallet-public-resource-bucket/logo/chain/solana.svg',
            }}
            width={adjust(36, 2)}
            height={adjust(36, 2)}
            label={formatNumber({
              input: estimatedEarningsSvm,
              type: NumberType.TokenNonTx,
            })}
          />
        </View>
      </View>
    </BaseButton>
  );
};

const IconItem = styled(function (props: {
  icon: IconProp;
  size: number;
  color: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { icon, size, color, label, style } = props;
  return (
    <View
      style={style}
      className='flex flex-1 flex-col items-center justify-between'
    >
      <FontAwesomeIcon icon={icon} size={size} color={color} />
      <Text className='text-text-primary text-sm font-bold'>{label}</Text>
    </View>
  );
});

export const SvgItem = styled(function (props: {
  source:
    | ImageSourcePropType
    | React.ComponentType<{ height: number; width: number }>;
  width: number;
  height: number;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { source, width, height, label, style } = props;
  return (
    <View
      style={style}
      className='flex flex-1 flex-col items-center justify-between'
    >
      <Svg source={source} width={width} height={height} />
      <Text className='text-text-primary text-sm font-bold'>{label}</Text>
    </View>
  );
});
