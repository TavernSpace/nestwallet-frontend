import { ILanguageCode } from '@nestwallet/app/graphql/client/generated/graphql';
import { LanguageContextProvider } from '@nestwallet/app/provider/language';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getDefaultStackNavigationOptions } from '../common/header/utils';
import { useLocalLanguageContext } from '../provider/local-language';
import { CodeWithData } from '../screens/auth/code';
import { LoginWithData } from '../screens/auth/login';
import { PrivateWithData } from '../screens/auth/private';
import { AuthStack, RootStackParamList } from './types';

type RouteProps = NativeStackScreenProps<RootStackParamList, 'auth'>;

export function AuthNavigator(props: RouteProps) {
  const { language } = useLocalLanguageContext();

  return (
    <LanguageContextProvider
      language={language}
      defaultLanguage={ILanguageCode.En}
    >
      <AuthStack.Navigator>
        <AuthStack.Screen
          name='login'
          component={LoginWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerTransparent: true,
            headerStyle: undefined,
          })}
        />
        <AuthStack.Screen
          name='code'
          component={CodeWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerTransparent: true,
            headerStyle: undefined,
          })}
        />
        <AuthStack.Screen
          name='private'
          component={PrivateWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
            headerTransparent: true,
            headerStyle: undefined,
          })}
        />
      </AuthStack.Navigator>
    </LanguageContextProvider>
  );
}
