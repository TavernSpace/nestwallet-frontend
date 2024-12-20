import { faExclamationCircle } from '@fortawesome/pro-solid-svg-icons';
import { groupBy } from 'lodash';
import { styled } from 'nativewind';
import { useState } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Banner } from '../../../../components/banner';
import { View } from '../../../../components/view';
import { colors } from '../../../../design/constants';
import {
  IMessageSeverity,
  IWarning,
} from '../../../../graphql/client/generated/graphql';
import { useLanguageContext } from '../../../../provider/language';
import { localization } from './localization';
import { ReportTransactionSheet } from './report-transaction-sheet';

export const RiskBanner = styled(function (props: {
  warnings: IWarning[];
  style?: StyleProp<ViewStyle>;
}) {
  const { warnings, style } = props;
  const { language } = useLanguageContext();

  const [showReportSheet, setShowReportSheet] = useState(false);

  const warningGroups = groupBy(warnings, (warning) => warning.severity);
  const critical = warningGroups[IMessageSeverity.Critical.toUpperCase()] ?? [];
  const moderate = warningGroups[IMessageSeverity.Warning.toUpperCase()] ?? [];
  const riskLevel =
    critical.length > 0 ? IMessageSeverity.Critical : IMessageSeverity.Warning;

  return warnings.length === 0 ? null : (
    <View style={style}>
      <Banner
        title={
          riskLevel === IMessageSeverity.Critical
            ? localization.riskLevelCritical[language]
            : localization.riskLevelMedium[language]
        }
        color={
          riskLevel === IMessageSeverity.Critical
            ? colors.failure
            : colors.warning
        }
        icon={faExclamationCircle}
        onPress={() => setShowReportSheet(true)}
      />
      <ReportTransactionSheet
        isShowing={showReportSheet}
        critical={critical}
        moderate={moderate}
        riskLevel={riskLevel}
        onClose={() => setShowReportSheet(false)}
      />
    </View>
  );
});
