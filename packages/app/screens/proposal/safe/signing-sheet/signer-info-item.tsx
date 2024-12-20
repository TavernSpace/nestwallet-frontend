import { faCheck } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { adjust, withSize } from '../../../../common/utils/style';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import { SafeSignerInfo } from '../../../../features/proposal/signer';
import { SignerDetail } from '../../../../molecules/transaction/signer';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

export function SafeSignerInfoItem(props: {
  signerInfo: SafeSignerInfo;
  isSelected?: boolean;
}) {
  const { signerInfo, isSelected } = props;
  const { language } = useLanguageContext();

  const size = adjust(20, 2);
  const iconSize = adjust(12, 2);

  return (
    <View className='flex w-full flex-row items-center justify-between px-4 py-4'>
      <SignerDetail
        className='flex-1 pr-2'
        signerInfo={signerInfo}
        displayType='others'
      />
      {signerInfo.hasSigned ? (
        <View className='flex flex-row items-center space-x-2 px-2'>
          <View className='bg-success block h-2 w-2 rounded-full' />
          <Text className='text-success text-xs font-medium'>
            {localization.signed[language]}
          </Text>
        </View>
      ) : signerInfo.signer && signerInfo.hasKeyring ? (
        <View className='px-2'>
          <View
            className={cn('items-center justify-center rounded-full', {
              'bg-primary/10': isSelected,
              'bg-card-highlight': !isSelected,
            })}
            style={withSize(size)}
          >
            <FontAwesomeIcon
              icon={faCheck}
              color={isSelected ? colors.primary : colors.textSecondary}
              size={iconSize}
            />
          </View>
        </View>
      ) : (
        <View className='flex flex-row items-center space-x-2 px-2'>
          <View className='bg-primary block h-2 w-2 rounded-full' />
          <Text className='text-primary text-xs font-medium'>
            {localization.pending[language]}
          </Text>
        </View>
      )}
    </View>
  );
}
