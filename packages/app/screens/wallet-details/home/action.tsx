import {
  faArrowDownToLine,
  faBridgeWater,
  faClone,
  faPaperPlaneTop,
} from '@fortawesome/pro-solid-svg-icons';
import { useCopy } from '../../../common/hooks/copy';
import { adjust, withSize } from '../../../common/utils/style';
import { BaseButton } from '../../../components/button/base-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { colors } from '../../../design/constants';
import {
  IBlockchainType,
  IWallet,
  IWalletType,
} from '../../../graphql/client/generated/graphql';

export function WalletActionSection(props: {
  wallet: IWallet;
  viewOnly: boolean;
  onReceivePress: VoidFunction;
  onSendPress: VoidFunction;
  onSwapPress?: VoidFunction;
}) {
  const { wallet, viewOnly, onReceivePress, onSendPress, onSwapPress } = props;
  const { copy } = useCopy('Copied address!');

  const iconSize = adjust(12, 2);

  return (
    <View className='flex w-full flex-row items-center justify-between space-x-2 px-4 py-1'>
      {!viewOnly && (
        <BaseButton className='flex-1' onPress={onSendPress}>
          <View className='bg-card-highlight flex flex-row items-center justify-center space-x-2 rounded-xl py-2'>
            <View
              className='bg-send/10 items-center justify-center rounded-full'
              style={withSize(iconSize + 10)}
            >
              <FontAwesomeIcon
                icon={faPaperPlaneTop}
                size={iconSize}
                color={colors.send}
              />
            </View>
            <Text className='text-text-secondary text-sm font-medium'>
              {'Send'}
            </Text>
          </View>
        </BaseButton>
      )}
      {viewOnly && (
        <BaseButton className='flex-1' onPress={() => copy(wallet.address)}>
          <View className='bg-card-highlight flex flex-row items-center justify-center space-x-2 rounded-xl py-2'>
            <View
              className='bg-approve/10 items-center justify-center rounded-full'
              style={withSize(iconSize + 10)}
            >
              <FontAwesomeIcon
                icon={faClone}
                size={iconSize}
                color={colors.approve}
              />
            </View>
            <Text className='text-text-secondary text-sm font-medium'>
              {'Copy'}
            </Text>
          </View>
        </BaseButton>
      )}
      <BaseButton className='flex-1' onPress={onReceivePress}>
        <View className='bg-card-highlight flex flex-row items-center justify-center space-x-2 rounded-xl py-2'>
          <View
            className='bg-receive/10 items-center justify-center rounded-full'
            style={withSize(iconSize + 10)}
          >
            <FontAwesomeIcon
              icon={faArrowDownToLine}
              size={iconSize + 2}
              color={colors.receive}
            />
          </View>
          <Text className='text-text-secondary text-sm font-medium'>
            {'Receive'}
          </Text>
        </View>
      </BaseButton>
      {onSwapPress &&
        !viewOnly &&
        wallet.blockchain !== IBlockchainType.Tvm &&
        // TODO: re-enable on iOS, Safe and Trezor
        wallet.type !== IWalletType.Trezor &&
        wallet.type !== IWalletType.Safe && (
          <BaseButton className='flex-1' onPress={onSwapPress}>
            <View className='bg-card-highlight flex flex-row items-center justify-center space-x-2 rounded-xl py-2'>
              <View
                className='bg-swap-light/10 items-center justify-center rounded-full'
                style={withSize(iconSize + 10)}
              >
                <FontAwesomeIcon
                  icon={faBridgeWater}
                  size={iconSize}
                  color={colors.swapLight}
                />
              </View>
              <Text className='text-text-secondary text-sm font-medium'>
                {'Bridge'}
              </Text>
            </View>
          </BaseButton>
        )}
    </View>
  );
}
