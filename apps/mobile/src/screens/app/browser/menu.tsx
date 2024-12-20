import { faEllipsisV } from '@fortawesome/pro-light-svg-icons';
import {
  faArrowsRotate,
  faHome,
  faPlug,
  faStar,
} from '@fortawesome/pro-solid-svg-icons';
import { ConnectedSite } from '@nestwallet/app/common/types';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { Menu } from '@nestwallet/app/components/menu';
import { MenuItem } from '@nestwallet/app/components/menu/item';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { isEmpty } from 'lodash';
import { useState } from 'react';

export function BrowserMenu(props: {
  site?: ConnectedSite;
  isFavorite: boolean;
  onFavorite: VoidFunction;
  onConnection: VoidFunction;
  onReload: VoidFunction;
  onHome: VoidFunction;
}) {
  const { site, isFavorite, onFavorite, onConnection, onReload, onHome } =
    props;

  const [showMenu, setShowMenu] = useState(false);

  return (
    <View className='flex flex-row items-center space-x-1 pr-1'>
      <Menu
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        anchor={
          <IconButton
            color={colors.textSecondary}
            icon={faEllipsisV}
            onPress={() => setShowMenu(true)}
            disableHover
            size={20}
          />
        }
        offsets={{ x: 34, y: 40 }}
        height={200}
        width={200}
      >
        <MenuItem
          title={'Favorite'}
          icon={faStar}
          iconColor={isFavorite ? colors.swapLight : colors.textSecondary}
          onPress={() => {
            setShowMenu(false);
            onFavorite();
          }}
        />
        {site && (
          <MenuItem
            title={'Connection'}
            icon={faPlug}
            iconColor={
              !isEmpty(site.connections) ? colors.approve : colors.textSecondary
            }
            onPress={() => {
              setShowMenu(false);
              onConnection();
            }}
          />
        )}
        {false && (
          <MenuItem
            title={'Home'}
            icon={faHome}
            iconColor={colors.textSecondary}
            onPress={() => {
              setShowMenu(false);
              onHome();
            }}
          />
        )}
        <MenuItem
          title={'Reload'}
          icon={faArrowsRotate}
          iconColor={colors.textSecondary}
          onPress={() => {
            setShowMenu(false);
            onReload();
          }}
        />
      </Menu>
    </View>
  );
}
