import { faTriangleExclamation } from '@fortawesome/pro-solid-svg-icons';
import cn from 'classnames';
import { FontAwesomeIcon } from '../../../../components/font-awesome-icon';
import { ActionSheet } from '../../../../components/sheet';
import { ActionSheetHeader } from '../../../../components/sheet/header';
import { Text } from '../../../../components/text';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import {
  IMessageSeverity,
  IWarning,
} from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';

interface ReportTransactionSheetProps {
  isShowing: boolean;
  riskLevel: IMessageSeverity;
  moderate: IWarning[];
  critical: IWarning[];
  onClose: VoidFunction;
}

export function ReportTransactionSheet(props: ReportTransactionSheetProps) {
  const { isShowing, moderate, critical, riskLevel, onClose } = props;
  const { language } = useLanguageContext();

  return (
    <ActionSheet isShowing={isShowing} onClose={onClose} isDetached={true}>
      <ActionSheetHeader
        title='Dangerous Message'
        onClose={onClose}
        type='detached'
      />
      <View className='mt-4 flex flex-col items-center space-y-4 px-4'>
        <View className='flex flex-col items-center space-y-2'>
          <View
            className={cn(
              'h-20 w-20 items-center justify-center rounded-full',
              {
                'bg-failure/10': riskLevel === IMessageSeverity.Critical,
                'bg-warning/10': riskLevel !== IMessageSeverity.Critical,
              },
            )}
          >
            <FontAwesomeIcon
              icon={faTriangleExclamation}
              size={48}
              color={
                riskLevel === IMessageSeverity.Critical
                  ? colors.failure
                  : colors.warning
              }
            />
          </View>
          <Text className='text-text-primary text-lg font-medium'>
            {riskLevel === IMessageSeverity.Critical
              ? 'Danger Detected'
              : 'Warnings Detected'}
          </Text>
        </View>
        <View className='flex flex-col space-y-2'>
          {critical.map((item) => (
            <View
              className='bg-failure/10 rounded-2xl px-4 py-3'
              key={item.kind}
            >
              <Text className='text-failure text-xs font-normal'>
                {item.message}
              </Text>
            </View>
          ))}
          {moderate.map((item) => (
            <View
              className='bg-warning/10 rounded-2xl px-4 py-3'
              key={item.kind}
            >
              <Text className='text-warning text-xs font-normal'>
                {item.message}
              </Text>
            </View>
          ))}
          <View className='bg-card rounded-2xl px-4 py-3'>
            <Text className='text-text-secondary text-xs font-normal'>
              {riskLevel === IMessageSeverity.Critical
                ? localization.criticalMessage[language]
                : localization.warningMessage[language]}
            </Text>
          </View>
        </View>
      </View>
    </ActionSheet>
  );
}
