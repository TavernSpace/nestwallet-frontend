import { faChevronLeft } from '@fortawesome/pro-regular-svg-icons';
import {
  faArrowRightArrowLeft,
  faBarsSort,
  faChartSimple,
  faClone,
  faShieldHalved,
  faStar as faSolidStar,
} from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import MoonshotLogo from '../../assets/images/logos/moonshot.png';
import PumpFunLogo from '../../assets/images/logos/pumpfun.png';
import { useCopy } from '../../common/hooks/copy';
import { Loadable } from '../../common/types';
import { adjust, withSize } from '../../common/utils/style';
import { CryptoAvatar } from '../../components/avatar/crypto-avatar';
import { BaseButton } from '../../components/button/base-button';
import {
  IconButton,
  ToggleIconButton,
} from '../../components/button/icon-button';
import { FontAwesomeIcon } from '../../components/font-awesome-icon';
import { Image } from '../../components/image';
import { Text } from '../../components/text';
import { View } from '../../components/view';
import { colors } from '../../design/constants';
import { ChainId } from '../../features/chain';
import { SvmTokenType } from '../../features/swap/types';
import { ICryptoBalance } from '../../graphql/client/generated/graphql';
import { ShowSnackbarSeverity, useSnackbar } from '../../provider/snackbar';
import { TokenDetailDisplay } from './types';

export function TokenHeaderLeft(props: {
  primaryAsset: ICryptoBalance;
  tokenType: Loadable<SvmTokenType>;
  favorite: Loadable<boolean>;
  onFavoritePress?: (favorite: boolean) => Promise<void>;
  onBack: VoidFunction;
}) {
  const { primaryAsset, tokenType, favorite, onFavoritePress, onBack } = props;
  const { showSnackbar } = useSnackbar();
  const { copy } = useCopy('Copied token address!');

  const [loading, setLoading] = useState(false);

  const handleFavoritePress = async () => {
    try {
      if (!favorite.success || loading || !onFavoritePress) return;
      setLoading(true);
      await onFavoritePress(!favorite.data);
    } catch {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: `Failed to ${favorite.data ? 'unfavorite' : 'favorite'} token`,
      });
    } finally {
      setLoading(false);
    }
  };

  const unsupportedChain =
    primaryAsset.chainId === ChainId.Ton ||
    primaryAsset.chainId === ChainId.Zora ||
    primaryAsset.chainId === ChainId.Gnosis;

  return (
    <View className='-ml-1 flex flex-row items-center'>
      <IconButton
        icon={faChevronLeft}
        size={adjust(18, 2)}
        onPress={onBack}
        color={colors.textPrimary}
      />
      {primaryAsset && (
        <View className='flex flex-row items-center space-x-2'>
          <BaseButton
            onPress={() => copy(primaryAsset.address)}
            disabled={primaryAsset.tokenMetadata.isNativeToken}
          >
            <View className='flex flex-row items-center space-x-2'>
              <CryptoAvatar
                url={primaryAsset.tokenMetadata.imageUrl}
                symbol={primaryAsset.tokenMetadata.symbol}
                chainId={primaryAsset.chainId}
                size={adjust(24, 2)}
              />
              <View className='flex flex-row items-center space-x-0.5'>
                <Text className='text-text-primary text-base font-medium'>
                  {primaryAsset.tokenMetadata.symbol}
                </Text>
              </View>
              {tokenType.success && tokenType.data === 'pumpfun' && (
                <View
                  className='items-center justify-center'
                  style={withSize(adjust(16, 2))}
                >
                  <Image source={PumpFunLogo} style={withSize(adjust(16, 2))} />
                </View>
              )}
              {tokenType.success && tokenType.data === 'moonshot' && (
                <View
                  className='items-center justify-center'
                  style={withSize(adjust(16, 2))}
                >
                  <Image
                    source={MoonshotLogo}
                    style={withSize(adjust(16, 2))}
                  />
                </View>
              )}
              {!primaryAsset.tokenMetadata.isNativeToken && (
                <FontAwesomeIcon
                  icon={faClone}
                  size={adjust(12, 2)}
                  color={colors.textSecondary}
                />
              )}
            </View>
          </BaseButton>
          {favorite.success && onFavoritePress && !unsupportedChain && (
            <BaseButton onPress={handleFavoritePress}>
              <FontAwesomeIcon
                icon={faSolidStar}
                size={adjust(14, 2)}
                color={favorite.data ? colors.approve : colors.textSecondary}
              />
            </BaseButton>
          )}
        </View>
      )}
    </View>
  );
}

export function TokenHeaderRight(props: {
  display: TokenDetailDisplay;
  onDisplayChange: (display: TokenDetailDisplay) => void;
}) {
  const { display, onDisplayChange } = props;

  return (
    <View className='flex flex-row items-center space-x-2'>
      <ToggleIconButton
        icon={faChartSimple}
        selected={display === 'overview'}
        onPress={() => onDisplayChange('overview')}
      />
      <ToggleIconButton
        icon={faArrowRightArrowLeft}
        selected={display === 'trades'}
        onPress={() => onDisplayChange('trades')}
      />
      <ToggleIconButton
        icon={faBarsSort}
        selected={display === 'details'}
        onPress={() => onDisplayChange('details')}
      />
      <ToggleIconButton
        icon={faShieldHalved}
        selected={display === 'security'}
        onPress={() => onDisplayChange('security')}
      />
    </View>
  );
}
