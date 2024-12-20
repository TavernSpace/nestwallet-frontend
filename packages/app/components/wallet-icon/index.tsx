import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faWallet } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { styled } from 'nativewind';
import { StyleProp, ViewStyle } from 'react-native';
import { withSize } from '../../common/utils/style';
import { colors } from '../../design/constants';
import { FontAwesomeIcon } from '../font-awesome-icon';
import { View } from '../view';

interface IWalletIconProps {
  size: number;
  icon?: IconProp;
  defaultStyle?: 'primary' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

export const WalletIcon = styled(function (props: IWalletIconProps) {
  const { size, icon = faWallet, defaultStyle, style } = props;
  return (
    <View style={style}>
      <View
        className={cn('flex items-center justify-center rounded-full', {
          'bg-primary/10': defaultStyle !== 'neutral',
          'bg-card-highlight': defaultStyle === 'neutral',
        })}
        style={withSize(size)}
      >
        <FontAwesomeIcon
          icon={icon}
          size={size / 1.8}
          color={
            defaultStyle === 'neutral' ? colors.textSecondary : colors.primary
          }
        />
      </View>
    </View>
  );
});
