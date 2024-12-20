import { faChevronLeft, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { View } from '@nestwallet/app/components/view';
import { colors } from '@nestwallet/app/design/constants';
import { NavigationProp } from '@react-navigation/native';
import {
  NativeStackNavigationOptions,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';

type HeaderOptionsFn = (props: {
  navigation: NavigationProp<ReactNavigation.RootParamList>;
}) => NativeStackNavigationOptions;

export const getDefaultStackNavigationOptions = (
  options?: Partial<NativeStackNavigationOptions>,
): HeaderOptionsFn => {
  return (props): NativeStackNavigationOptions => {
    const { navigation } = props;
    return {
      contentStyle: { backgroundColor: colors.background },
      headerTitleAlign: 'center',
      headerShadowVisible: false,
      headerStyle: {
        backgroundColor: colors.background,
      },
      headerTitleStyle: {
        color: colors.textPrimary,
        fontSize: 18,
        fontFamily: 'Aeonik_500Medium',
        fontWeight: '500',
      },
      headerLeft: () => {
        return navigation.canGoBack() ? (
          <View className='-ml-1'>
            <IconButton
              icon={faChevronLeft}
              size={20}
              onPress={navigation.goBack}
              color={colors.textPrimary}
            />
          </View>
        ) : (
          <View />
        );
      },
      ...options,
    };
  };
};

export function getModalStackNavigationOptions(
  props: NativeStackScreenProps<any>,
): NativeStackNavigationOptions {
  return {
    contentStyle: { backgroundColor: colors.background },
    headerTitleAlign: 'center',
    headerShadowVisible: false,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTitleStyle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontFamily: 'Aeonik_500Medium',
      fontWeight: '500',
    },
    headerRight: () => (
      <IconButton
        icon={faTimes}
        size={22}
        onPress={props.navigation.goBack}
        color={colors.textPrimary}
      />
    ),
  };
}
