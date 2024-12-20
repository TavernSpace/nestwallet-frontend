import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/pro-regular-svg-icons';
import { faHourglassStart, faTicket } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { LinearGradient } from 'expo-linear-gradient';
import { isNil } from 'lodash';
import { DateTime } from 'luxon';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import XP from '../../../assets/images/xp.svg';
import { opacity } from '../../../common/utils/functions';
import { adjust, withSize } from '../../../common/utils/style';
import { BlockchainAvatar } from '../../../components/avatar/blockchain-avatar';
import { ChainAvatar } from '../../../components/avatar/chain-avatar';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Svg } from '../../../components/svg';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import { ChainId, getChainInfo } from '../../../features/chain';
import {
  IBlockchainType,
  IPromoCode,
} from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export const PromoListItem = (props: {
  promo: IPromoCode;
  style?: StyleProp<ViewStyle>;
}) => {
  const { promo } = props;

  const [collapsed, setCollapsed] = useState(true);

  const badgeSize = adjust(28, 2);
  const borderColor = colors.cardHighlight;
  const hasBlockchainAvatars =
    !isNil(promo.feeEvmDiscount) ||
    !isNil(promo.feeSvmDiscount) ||
    !isNil(promo.feeTvmDiscount);

  return (
    <View className='bg-card mb-2 rounded-2xl'>
      <BaseButton
        onPress={() => setCollapsed(!collapsed)}
        animationEnabled={false}
        rippleEnabled={false}
      >
        <View className='flex flex-row items-center justify-between px-4 py-3'>
          <View className='flex flex-row items-center space-x-3'>
            <View
              className='bg-primary/10 items-center justify-center rounded-full'
              style={withSize(adjust(36))}
            >
              <FontAwesomeIcon
                icon={faTicket}
                color={colors.primary}
                size={adjust(22, 2)}
                transform={{ rotate: 315 }}
              />
            </View>
            <View className='flex flex-col'>
              <Text className='text-text-primary text-sm font-medium'>
                {promo.code}
              </Text>
              {!isNil(promo.expireAt) && (
                <View className='flex items-center justify-center'>
                  <ExpirationChip
                    color={colors.questTime}
                    icon={faHourglassStart}
                    expireAt={promo.expireAt}
                  />
                </View>
              )}
            </View>
          </View>
          <View className='flex flex-row items-center justify-end space-x-2'>
            {(hasBlockchainAvatars || !isNil(promo.points)) && (
              <View className='flex flex-row items-center space-x-1'>
                {!isNil(promo.feeEvmDiscount) && (
                  <ChainAvatar
                    chainInfo={getChainInfo(ChainId.Ethereum)}
                    size={badgeSize}
                    borderColor={borderColor}
                  />
                )}
                {!isNil(promo.feeSvmDiscount) && (
                  <BlockchainAvatar
                    blockchain={IBlockchainType.Svm}
                    size={badgeSize}
                    borderColor={borderColor}
                  />
                )}
                {!isNil(promo.feeTvmDiscount) && (
                  <BlockchainAvatar
                    blockchain={IBlockchainType.Tvm}
                    size={badgeSize}
                    borderColor={borderColor}
                  />
                )}
                {!isNil(promo.points) && (
                  <View
                    className='bg-primary/10 items-center justify-center rounded-full'
                    style={withSize(badgeSize)}
                  >
                    <Svg
                      source={XP}
                      height={adjust(14, 2)}
                      width={adjust(18, 2)}
                    />
                  </View>
                )}
              </View>
            )}
            <FontAwesomeIcon
              icon={collapsed ? faChevronRight : faChevronDown}
              color={colors.textSecondary}
              size={adjust(14, 2)}
            />
          </View>
        </View>
      </BaseButton>
      {!collapsed && (
        <View>
          <LinearGradient
            colors={[colors.background, colors.questBorder, colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            locations={[0.01, 0.1, 1]}
            style={{
              height: 1,
              width: '100%',
            }}
          />
          <View className='bg-card flex flex-row rounded-b-xl px-3 pb-4'>
            <View className='flex flex-1 flex-col pl-4'>
              <RewardsCard promo={promo} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

function RewardsCard(props: { promo: IPromoCode }) {
  const { promo } = props;
  const badgeSize = adjust(18, 2);
  const borderColor = colors.cardHighlight;

  return (
    <View className='flex flex-row space-x-2'>
      {!isNil(promo.points) && (
        <View className='flex flex-col'>
          <View className='bg-card-highlight flex h-12 w-10 flex-col items-center justify-between pt-1.5'>
            <Svg source={XP} height={adjust(14, 2)} width={adjust(18, 2)} />
            <Text className='text-text-primary text-xs font-bold'>
              {promo.points}
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      )}
      {!isNil(promo.feeEvmDiscount) && (
        <View className='flex flex-col'>
          <View className='bg-card-highlight flex h-12 w-10 flex-col items-center justify-between pt-1'>
            <ChainAvatar
              chainInfo={getChainInfo(ChainId.Ethereum)}
              size={badgeSize}
              borderColor={borderColor}
            />
            <Text className='text-text-primary text-xs font-bold'>
              {promo.feeEvmDiscount}%
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      )}
      {!isNil(promo.feeSvmDiscount) && (
        <View className='flex flex-col'>
          <View className='bg-card-highlight flex h-12 w-10 flex-col items-center justify-between pt-1'>
            <BlockchainAvatar
              blockchain={IBlockchainType.Svm}
              size={badgeSize}
              borderColor={borderColor}
            />
            <Text className='text-text-primary text-xs font-bold'>
              {promo.feeSvmDiscount}%
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      )}
      {!isNil(promo.feeTvmDiscount) && (
        <View className='flex flex-col'>
          <View className='bg-card-highlight flex h-12 w-10 flex-col items-center justify-between pt-1.5'>
            <BlockchainAvatar
              blockchain={IBlockchainType.Tvm}
              size={badgeSize}
              borderColor={borderColor}
            />
            <Text className='text-text-primary text-xs font-bold'>
              {promo.feeTvmDiscount}%
            </Text>
          </View>
          <View
            style={{
              borderTopWidth: 8,
              borderTopColor: colors.cardHighlight,
              borderLeftWidth: 16,
              borderLeftColor: 'transparent',
              borderRightWidth: 16,
              borderRightColor: 'transparent',
            }}
          />
        </View>
      )}
    </View>
  );
}

interface ExpirationChipProps {
  color: string;
  size?: 'small' | 'medium';
  icon?: IconProp;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  expireAt?: string | undefined;
}

const ExpirationChip = styled(function (props: ExpirationChipProps) {
  const { color, icon, size = 'small', iconSize, style, expireAt } = props;
  const { language } = useLanguageContext();
  const expirationDate = expireAt ? DateTime.fromISO(expireAt) : null;
  const now = DateTime.now();
  const duration = expirationDate ? expirationDate.diff(now) : null;

  const displayText =
    duration && duration.toMillis() > 0
      ? duration.toFormat("d'd' h'h' m'm'")
      : localization.expired[language];

  return (
    <View
      className={cn(
        'flex w-fit flex-row items-center justify-center rounded-full',
        {
          'space-x-1 px-2 py-[1px]': size === 'small',
          'space-x-2 px-3 py-[3px]': size !== 'small',
        },
      )}
      style={[{ backgroundColor: opacity(color, 10) }, style]}
    >
      {icon && (
        <FontAwesomeIcon
          icon={icon}
          color={color}
          size={iconSize || adjust(size === 'small' ? 8 : 10, 2)}
        />
      )}
      <Text
        className={cn('font-medium', {
          'text-xs': size === 'small',
          'text-sm': size !== 'small',
        })}
        style={{ color }}
      >
        {displayText}
      </Text>
    </View>
  );
});
