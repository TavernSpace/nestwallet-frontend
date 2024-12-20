import cn from 'classnames';
import { memo } from 'react';
import { Platform } from 'react-native';
import { BaseButton } from '../../components/button/base-button';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { IUser } from '../../graphql/client/generated/graphql';
import { useAudioContext } from '../../provider/audio';
import { useLanguageContext } from '../../provider/language';
import { localization } from './localization';
import { TradeMenu } from './menu';
import { QuickTradeMode, TradeAction } from './types';

interface ModeSectionProps {
  user: IUser;
  action: TradeAction;
  mode: QuickTradeMode;
  showSettings: boolean;
  disabled: boolean;
  onModeChange: (mode: QuickTradeMode) => void;
  onActionChange: (action: TradeAction) => void;
}

function arePropsEqual(prev: ModeSectionProps, cur: ModeSectionProps) {
  return (
    prev.user === cur.user &&
    prev.action === cur.action &&
    prev.mode === cur.mode &&
    prev.showSettings === cur.showSettings &&
    prev.disabled === cur.disabled &&
    prev.onModeChange === cur.onModeChange &&
    prev.onActionChange === cur.onActionChange
  );
}

export const ModeSection = memo(function (props: ModeSectionProps) {
  const { user, action, mode, disabled, onModeChange, onActionChange } = props;
  const { pressSound } = useAudioContext().sounds;
  const { language } = useLanguageContext();

  return (
    <View className='flex flex-row items-center space-x-2 px-4'>
      <View className='bg-card-highlight flex-1 flex-row items-center justify-center rounded-xl'>
        <BaseButton
          className='flex-1'
          pressSound={pressSound}
          onPress={() => onModeChange('buy')}
          disabled={disabled}
        >
          <View
            className={cn('flex items-center justify-center rounded-xl', {
              'bg-success/10': mode === 'buy',
              'bg-card-highlight': mode !== 'buy',
              'h-9': Platform.OS === 'web',
              'h-10': Platform.OS !== 'web',
            })}
          >
            <Text
              className={cn('text-center text-sm font-medium', {
                'text-success': mode === 'buy',
                'text-text-secondary': mode !== 'buy',
              })}
            >
              {localization.buy[language]}
            </Text>
          </View>
        </BaseButton>
        <BaseButton
          className='flex-1'
          pressSound={pressSound}
          onPress={() => onModeChange('sell')}
          disabled={disabled}
        >
          <View
            className={cn('flex items-center justify-center rounded-xl', {
              'bg-failure/10': mode === 'sell',
              'bg-card-highlight': mode !== 'sell',
              'h-9': Platform.OS === 'web',
              'h-10': Platform.OS !== 'web',
            })}
          >
            <Text
              className={cn('text-center text-sm font-medium', {
                'text-failure': mode === 'sell',
                'text-text-secondary': mode !== 'sell',
              })}
            >
              {localization.sell[language]}
            </Text>
          </View>
        </BaseButton>
      </View>
      <TradeMenu
        user={user}
        action={action}
        disabled={disabled}
        onActionChange={onActionChange}
      />
    </View>
  );
}, arePropsEqual);
