import { faUsbDrive } from '@fortawesome/pro-solid-svg-icons';
import Transport from '@ledgerhq/hw-transport';
import TransportWebHID from '@ledgerhq/hw-transport-webhid';
import { TextButton } from '../../../components/button/text-button';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { onBlockchain } from '../../../features/chain';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

interface ImportHardwareConnectLedgerScreenProps {
  blockchain: IBlockchainType;
  action: 'import' | 'connect';
  onContinue: (transport: Transport) => void;
  closeTab: VoidFunction;
}

export function ImportHardwareConnectLedgerScreen(
  props: ImportHardwareConnectLedgerScreenProps,
) {
  const { blockchain, action, onContinue, closeTab } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const handleConnect = async () => {
    try {
      const transport = await TransportWebHID.create();
      if (action === 'connect') {
        closeTab();
      } else {
        onContinue(transport);
      }
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: (err as Error).message,
      });
    }
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4 pt-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon icon={faUsbDrive} color={colors.success} size={48} />
        </View>
        <View className='flex flex-1 flex-col space-y-6 pt-8'>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary pr-2 text-sm font-medium'>
              {localization.one[language]}
            </Text>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.closeApps[language]}
              </Text>
            </View>
          </View>
          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary pr-2 text-sm font-medium'>
              {localization.two[language]}
            </Text>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {`${localization.plugLedger[language]} ${onBlockchain(
                  blockchain,
                )(
                  () => localization.ethereum[language],
                  () => localization.solana[language],
                  () => localization.ton[language],
                )} ${localization.app[language]}`}
              </Text>
            </View>
          </View>

          <View className='flex flex-row items-center space-x-2'>
            <Text className='text-text-primary pr-2 text-sm font-medium'>
              {localization.three[language]}
            </Text>
            <View className='bg-card flex-1 rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-sm font-normal'>
                {localization.allowAccess[language]}
              </Text>
            </View>
          </View>
        </View>
        <View className='mt-4 w-full'>
          <TextButton
            onPress={handleConnect}
            text={localization.connect[language]}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
