import {
  faArrowsToDottedLine,
  faClockRotateLeft,
  faStore,
} from '@fortawesome/pro-solid-svg-icons';
import { memo, useState } from 'react';
import { adjust } from '../../common/utils/style';
import { BaseButton } from '../../components/button/base-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Menu } from '../../components/menu';
import { MenuItem } from '../../components/menu/item';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { IUser } from '../../graphql/client/generated/graphql';
import { useAudioContext } from '../../provider/audio';
import { TradeAction } from './types';

export const TradeMenu = memo(function (props: {
  user: IUser;
  action: TradeAction;
  disabled: boolean;
  onActionChange: (action: TradeAction) => void;
}) {
  const { user, action, disabled, onActionChange } = props;
  const { pressSound } = useAudioContext().sounds;

  const [showMenu, setShowMenu] = useState(false);

  return (
    <Menu
      visible={showMenu}
      onDismiss={() => setShowMenu(false)}
      anchor={
        <BaseButton
          className='flex-1'
          style={{ marginLeft: adjust(0, 8) }}
          pressSound={pressSound}
          onPress={() => setShowMenu(true)}
          disabled={disabled}
        >
          <View
            className='bg-card-highlight flex items-center justify-center rounded-xl'
            style={{ width: 100, height: adjust(36) }}
          >
            <View className='flex flex-row items-center space-x-2'>
              <FontAwesomeIcon
                icon={
                  action === 'spot'
                    ? faStore
                    : action === 'limit'
                    ? faArrowsToDottedLine
                    : faClockRotateLeft
                }
                size={adjust(14, 2)}
                color={colors.textSecondary}
              />
              <Text className='text-text-secondary text-sm font-medium'>
                {action === 'spot' ? 'Market' : 'Limit'}
              </Text>
            </View>
          </View>
        </BaseButton>
      }
      offsets={{ x: 100, y: 40 }}
      height={200}
      width={160}
    >
      <MenuItem
        title={'Market'}
        icon={faStore}
        onPress={() => {
          setShowMenu(false);
          onActionChange('spot');
        }}
      />
      <MenuItem
        title={'Limit'}
        icon={faArrowsToDottedLine}
        onPress={() => {
          setShowMenu(false);
          onActionChange('limit');
        }}
      />
    </Menu>
  );
});
