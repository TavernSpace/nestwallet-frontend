import { faBallotCheck, faSeedling } from '@fortawesome/pro-solid-svg-icons';
import { useState } from 'react';
import { VoidPromiseFunction } from '../../../common/types';
import { adjust, withSize } from '../../../common/utils/style';
import { BlockchainAvatar } from '../../../components/avatar/blockchain-avatar';
import { FontAwesomeIcon } from '../../../components/font-awesome-icon';
import { ButtonListItem } from '../../../components/list/button-list-item';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { colors } from '../../../design/constants';
import { IBlockchainType } from '../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../provider/language';
import { ShowSnackbarSeverity, useSnackbar } from '../../../provider/snackbar';
import { localization } from './localization';

export function ImportWalletSeedTypeScreen(props: {
  onSingle: VoidPromiseFunction;
  onMultiple: VoidPromiseFunction;
}) {
  const { onMultiple, onSingle } = props;
  const { showSnackbar } = useSnackbar();
  const { language } = useLanguageContext();

  const [loading, setLoading] = useState(false);

  const size = adjust(36);
  const iconSize = adjust(18, 2);

  const handleSingle = async () => {
    try {
      setLoading(true);
      await onSingle();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorMessage[language],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMultiple = async () => {
    try {
      setLoading(true);
      await onMultiple();
    } catch (err) {
      showSnackbar({
        severity: ShowSnackbarSeverity.error,
        message: localization.errorMessage[language],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ViewWithInset className='h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col items-center px-4'>
        <View className='bg-success/10 h-20 w-20 items-center justify-center rounded-full'>
          <FontAwesomeIcon
            icon={faBallotCheck}
            color={colors.success}
            size={48}
          />
        </View>
        <View className='mt-8 flex w-full flex-col justify-center'>
          <View className='flex flex-col'>
            <Text className='text-text-primary text-lg font-medium'>
              {localization.chooseSeedType[language]}
            </Text>
            <Text className='text-text-secondary mt-2 text-sm font-normal'>
              {localization.seedTypeDescription[language]}
            </Text>
            <View className='mt-4 space-y-2'>
              <ButtonListItem
                onPress={handleMultiple}
                title={localization.addMultipleWallets[language]}
                subtitle={localization.addMultipleWalletsDescription[language]}
                disabled={loading}
              >
                <View
                  className='bg-success/10 flex flex-row items-center justify-center rounded-full'
                  style={withSize(size)}
                >
                  <FontAwesomeIcon
                    icon={faSeedling}
                    size={iconSize}
                    color={colors.success}
                  />
                </View>
              </ButtonListItem>
              <ButtonListItem
                onPress={handleSingle}
                title={localization.addSingleWallet[language]}
                subtitle={localization.addSingleWalletDescription[language]}
                disabled={loading}
              >
                <BlockchainAvatar
                  blockchain={IBlockchainType.Tvm}
                  size={size}
                />
              </ButtonListItem>
            </View>
          </View>
        </View>
      </View>
    </ViewWithInset>
  );
}
