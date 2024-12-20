import { faPlus, faUsbDrive } from '@fortawesome/pro-solid-svg-icons';
import LedgerLogo from '../../../assets/images/logos/ledger.png';
import SafeLogo from '../../../assets/images/logos/safe-logo-green.png';
import { adjust, withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Image } from '../../../components/image';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { WalletIcon } from '../../../components/wallet-icon';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

interface ImportWalletTypeProps {
  blockchain: IBlockchainType;
  onAddSigner: VoidFunction;
  onAddHardware?: VoidFunction;
  onAddSafe: VoidFunction;
}

export function ImportWalletTypeScreen(props: ImportWalletTypeProps) {
  const { blockchain, onAddSafe, onAddHardware, onAddSigner } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);
  const iconSize = adjust(18, 2);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faPlus} color={colors.success} size={48} />
        </View>
        <View className='mt-8 flex w-full flex-col justify-center'>
          <Text className='text-text-primary text-lg font-medium'>
            {localization.addWalletScreenTitle[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-normal'>
            {localization.addWalletScreenDescription[language]}
          </Text>
          <View className='mt-4 space-y-2'>
            <ButtonListItem
              onPress={onAddSigner}
              title={localization.addWallet[language]}
              subtitle={localization.addWalletSubtitle[language]}
            >
              <WalletIcon size={size} defaultStyle='primary' />
            </ButtonListItem>
            {onAddHardware && blockchain !== IBlockchainType.Tvm && (
              <ButtonListItem
                onPress={onAddHardware}
                title={onBlockchain(blockchain)(
                  () => localization.addHardwareWallet[language],
                  () => localization.addLedgerWallet[language],
                  () => localization.addLedgerWallet[language],
                )}
                subtitle={onBlockchain(blockchain)(
                  () => localization.addHardwareWalletSubtitle[language],
                  () => localization.addLedgerWalletSubtitle[language],
                  () => localization.addLedgerWalletSubtitle[language],
                )}
              >
                {onBlockchain(blockchain)(
                  () => (
                    <View
                      className='flex flex-row items-center justify-center rounded-full bg-black'
                      style={withSize(size)}
                    >
                      <FontAwesomeIcon
                        icon={faUsbDrive}
                        size={iconSize}
                        transform={{ rotate: 270 }}
                        color={colors.textPrimary}
                      />
                    </View>
                  ),
                  () => (
                    <View
                      className='items-center justify-center overflow-hidden rounded-full bg-black'
                      style={withSize(size)}
                    >
                      <Image
                        style={withSize(adjust(33, 1))}
                        source={LedgerLogo}
                      />
                    </View>
                  ),
                  () => (
                    <View
                      className='items-center justify-center overflow-hidden rounded-full bg-black'
                      style={withSize(size)}
                    >
                      <Image
                        style={withSize(adjust(33, 1))}
                        source={LedgerLogo}
                      />
                    </View>
                  ),
                )}
              </ButtonListItem>
            )}
            {blockchain === IBlockchainType.Evm && (
              <ButtonListItem
                onPress={onAddSafe}
                title={localization.addSafeWallet[language]}
                subtitle={localization.addSafeWalletSubtitle[language]}
              >
                <Image
                  source={SafeLogo}
                  className='rounded-full'
                  style={withSize(size)}
                />
              </ButtonListItem>
            )}
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
