import {
  SWITCH_PROVIDER_REMAIN_RESPONSE,
  SWITCH_PROVIDER_SWITCH_RESPONSE,
} from '@nestwallet/app/common/constants';
import { IApproveInput } from '@nestwallet/app/common/types';
import { onLoadable } from '@nestwallet/app/common/utils/query';
import { View } from '@nestwallet/app/components/view';
import { SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { ApprovalChooseProviderScreen } from '@nestwallet/app/screens/approval/choose-provider/screen';
import { StackScreenProps } from '@react-navigation/stack';
import cn from 'classnames';
import { decodePayload } from '../../../../common/navigation/utils';
import { useInternalApprovalModalStackNavigationOptions } from '../../../navigation/navigators/options';
import { RootStackParamList } from '../../../navigation/types';
import { useAppContext } from '../../../provider/application';
import { useLocalLanguageContext } from '../../../provider/local-language';
import { useOverlayDimension } from '../utils';

type ChooseProviderRouteParams = IApproveInput;

type RouteProps = StackScreenProps<RootStackParamList, 'chooseProvider'>;

export function ChooseProviderWithData({ route }: RouteProps) {
  const { payload } = route.params;
  const { language } = useLocalLanguageContext();
  const decodedPayload = decodePayload<ChooseProviderRouteParams>(payload);

  useInternalApprovalModalStackNavigationOptions(
    decodedPayload,
    'Connection rejected',
  );

  return onLoadable(language)(
    () => null,
    () => (
      <ChooseProviderWithLanguage
        params={decodedPayload}
        language={ILanguageCode.En}
      />
    ),
    (language) => (
      <ChooseProviderWithLanguage params={decodedPayload} language={language} />
    ),
  );
}

function ChooseProviderWithLanguage(props: {
  params: ChooseProviderRouteParams;
  language: ILanguageCode;
}) {
  const { params, language } = props;
  const { walletService } = useAppContext();
  const { overlayDimensions, widthLimit, handleLayout } = useOverlayDimension();
  const { requestId, origin, tabId, blockchain } = params;

  const handleOtherWallet = async () => {
    await walletService.resolveApproval({
      requestId: requestId,
      tabId,
      blockchain,
      result: SWITCH_PROVIDER_SWITCH_RESPONSE,
    });
    window.close();
  };

  const handleNestWallet = async () => {
    await walletService.resolveApproval({
      requestId: requestId,
      tabId,
      blockchain,
      result: SWITCH_PROVIDER_REMAIN_RESPONSE,
    });
    window.close();
  };

  return (
    <View
      className='flex flex-1 items-center justify-center overflow-hidden bg-black'
      onLayout={handleLayout}
    >
      <View
        className={cn('bg-background overflow-hidden', {
          'border-card-highlight border': overlayDimensions.width >= widthLimit,
        })}
        style={[
          overlayDimensions,
          { borderRadius: (overlayDimensions.width - SCREEN_WIDTH) * 1.5 },
        ]}
      >
        <ApprovalChooseProviderScreen
          language={language}
          origin={origin}
          onOtherWallet={handleOtherWallet}
          onNestWallet={handleNestWallet}
        />
      </View>
    </View>
  );
}
