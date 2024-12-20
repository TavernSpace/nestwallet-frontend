import DappConnection from '../../../assets/images/dapp_connection.svg';
import { TextButton } from '../../../components/button/text-button';
import { Svg } from '../../../components/svg';
import { Text } from '../../../components/text';
import { View } from '../../../components/view';
import { ViewWithInset } from '../../../components/view/view-with-inset';
import { useLanguageContext } from '../../../provider/language';
import { localization } from '../localization';

interface IntroDappScreenProps {
  onContinue: VoidFunction;
}

export function IntroDappScreen(props: IntroDappScreenProps) {
  const { onContinue } = props;
  const { language } = useLanguageContext();

  return (
    <ViewWithInset className='absolute h-full w-full' hasBottomInset={true}>
      <View className='flex h-full flex-col justify-between px-4'>
        <View className='flex flex-1 flex-col'>
          <Text className='text-text-primary text-center text-xl font-bold'>
            {localization.connectToDapps[language]}
          </Text>
          <Text className='text-text-secondary mt-4 text-center text-sm font-medium'>
            {localization.connectToDappsDescription[language]}
          </Text>
          <View className='mt-12 items-center justify-center'>
            <Svg source={DappConnection} height={250} width={300} />
          </View>
        </View>

        <View className='w-full'>
          <TextButton
            onPress={onContinue}
            text={localization.getStarted[language]}
          />
        </View>
      </View>
    </ViewWithInset>
  );
}
