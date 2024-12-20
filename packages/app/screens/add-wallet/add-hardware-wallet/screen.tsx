import { faUsbDrive } from '@fortawesome/pro-solid-svg-icons';
import LedgerLogo from '../../../assets/images/logos/ledger.png';
import TrezorLogo from '../../../assets/images/logos/trezor.png';
import { adjust, withSize } from '../../../common/utils/style';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Image } from '../../../components/image';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { IWalletType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { localization } from './localization';

export function AddHardwareWalletScreen(props: {
  onSubmit: (walletType: IWalletType) => void;
}) {
  const { onSubmit } = props;
  const { language } = useLanguageContext();
  const size = adjust(36);

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faUsbDrive} color={colors.success} size={48} />
        </View>
        <View className='mt-8 flex-1 space-y-2'>
          <Text className='text-text-primary text-lg font-medium'>
            {localization.addHardwareWallet[language]}
          </Text>
          <Text className='text-text-secondary mt-2 text-sm font-normal'>
            {localization.chooseHardwareWallet[language]}
          </Text>
          <View className='mt-6 flex-col space-y-2'>
            <ButtonListItem
              onPress={() => onSubmit(IWalletType.Ledger)}
              title={localization.ledger[language]}
              subtitle={localization.ledgerSubtitle[language]}
            >
              <View
                className='items-center justify-center overflow-hidden rounded-full bg-black'
                style={withSize(size)}
              >
                <Image style={withSize(adjust(33, 1))} source={LedgerLogo} />
              </View>
            </ButtonListItem>
            <ButtonListItem
              onPress={() => onSubmit(IWalletType.Trezor)}
              title={localization.trezor[language]}
              subtitle={localization.trezorSubtitle[language]}
            >
              <View
                className='items-center justify-center overflow-hidden rounded-full'
                style={withSize(size)}
              >
                <Image style={withSize(size)} source={TrezorLogo} />
              </View>
            </ButtonListItem>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
