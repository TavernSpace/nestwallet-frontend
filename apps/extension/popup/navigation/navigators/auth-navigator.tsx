import { View } from '@nestwallet/app/components/view';
import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { LanguageContextProvider } from '@nestwallet/app/provider/language';
import { CardStyleInterpolators } from '@react-navigation/stack';
import { useLocalLanguageContext } from '../../provider/local-language';
import { CodeWithData } from '../../screens/auth/code';
import { LoginWithData } from '../../screens/auth/login';
import { PrivateWithData } from '../../screens/auth/private';
import { AuthStack } from '../types';
import { getDefaultStackNavigationOptions } from './options';

export function AuthNavigator() {
  const { language } = useLocalLanguageContext();

  return (
    <LanguageContextProvider
      language={language}
      defaultLanguage={ILanguageCode.En}
    >
      <View className='h-full w-full overflow-hidden'>
        <AuthStack.Navigator>
          <AuthStack.Screen
            name='login'
            component={LoginWithData}
            options={getDefaultStackNavigationOptions({
              title: '',
              headerTransparent: true,
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            })}
          />
          <AuthStack.Screen
            name='code'
            component={CodeWithData}
            options={getDefaultStackNavigationOptions({
              title: '',
              headerTransparent: true,
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            })}
          />
          <AuthStack.Screen
            name='private'
            component={PrivateWithData}
            options={getDefaultStackNavigationOptions({
              title: '',
              headerTransparent: true,
              cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
            })}
          />
        </AuthStack.Navigator>
      </View>
    </LanguageContextProvider>
  );
}
