import { makeLoadable } from '@nestwallet/app/common/utils/query';
import { View } from '@nestwallet/app/components/view';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { LanguageContextProvider } from '@nestwallet/app/provider/language';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { IntroDapp } from '../../screens/intro/dapp';
import { IntroInfo } from '../../screens/intro/info';
import { IntroStack } from '../types';
import { getDefaultStackNavigationOptions } from './options';

export function IntroNavigator() {
  // TODO: should we add a choose language option here?
  return (
    <View className='h-full w-full'>
      <LanguageContextProvider
        language={makeLoadable(ILanguageCode.En)}
        defaultLanguage={ILanguageCode.En}
      >
        <IntroStack.Navigator
          initialRouteName='introInfo'
          screenOptions={{
            animationEnabled: true,
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
          }}
        >
          <IntroStack.Screen
            name='introInfo'
            component={IntroInfo}
            options={getDefaultStackNavigationOptions({ title: '' })}
          />
          <IntroStack.Screen
            name='introDapp'
            component={IntroDapp}
            options={getDefaultStackNavigationOptions({ title: '' })}
          />
        </IntroStack.Navigator>
      </LanguageContextProvider>
    </View>
  );
}
