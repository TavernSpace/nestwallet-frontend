import { faListOl } from '@fortawesome/pro-solid-svg-icons';
import { Origin } from '../../../common/types';
import { TextButton } from '../../../components/button/text-button';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { ILanguageCode } from '../../../graphql/client/generated/graphql';
import { RequestHeader } from '../header';
import { localization } from './localization';

interface ApprovalChooseProviderScreenProps {
  language: ILanguageCode;
  origin?: Origin;
  onOtherWallet: VoidFunction;
  onNestWallet: VoidFunction;
}

export function ApprovalChooseProviderScreen(
  props: ApprovalChooseProviderScreenProps,
) {
  const { language, origin, onOtherWallet, onNestWallet } = props;

  return (
    <ViewWithInset
      className='bg-background absolute h-full w-full'
      hasBottomInset={true}
    >
      <View className='flex h-full w-full flex-col justify-between'>
        <View className='flex flex-col'>
          <RequestHeader
            origin={origin}
            connectionType='injection'
            icon={faListOl}
            text={localization.chooseProvider[language]}
          />
          <View className='flex flex-col items-center justify-center px-4 pt-3'>
            <View className='bg-card w-full rounded-2xl px-4 py-3'>
              <Text className='text-text-secondary text-xs font-normal'>
                {localization.multipleWalletsDetected[language]}
              </Text>
            </View>
          </View>
        </View>
        <View className='flex flex-row items-center space-x-4 px-4 pt-4'>
          <TextButton
            className='flex-1'
            text={localization.useMetamask[language]}
            type='tertiary'
            onPress={onOtherWallet}
          />
          <TextButton
            className='flex-1'
            text={localization.useNestWallet[language]}
            onPress={onNestWallet}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
