import { StackActions, useNavigation } from '@react-navigation/native';
import type { StackNavigationOptions } from '@react-navigation/stack';
import * as React from 'react';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useNavigationOptions(options: StackNavigationOptions) {
  const navigation = useNavigation();
  return useEffect(() => {
    navigation.setOptions(options);
  }, [options]);
}

export function useReplaceTo<
  ParamList extends ReactNavigation.RootParamList = ReactNavigation.RootParamList,
  RouteName extends keyof ParamList = keyof ParamList,
>() {
  const navigation = useNavigation();
  const replaceTo = React.useCallback(
    (screen: Extract<RouteName, string>, params?: ParamList[RouteName]) => {
      navigation.dispatch(StackActions.replace(screen, params as object));
    },
    [navigation],
  );
  return replaceTo;
}

export function useResetTo<
  ParamList extends ReactNavigation.RootParamList = ReactNavigation.RootParamList,
  RouteName extends keyof ParamList = keyof ParamList,
>() {
  const navigation = useNavigation();
  const resetTo = React.useCallback(
    (screen: Extract<RouteName, string>, params?: ParamList[RouteName]) => {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: screen as keyof ReactNavigation.RootParamList,
            params: params as object,
          },
        ],
      });
    },
    [navigation],
  );
  return resetTo;
}

export function useResetToRoutes<
  ParamList extends ReactNavigation.RootParamList = ReactNavigation.RootParamList,
  RouteName extends keyof ParamList = keyof ParamList,
>() {
  const navigation = useNavigation();
  type ResetToParams = {
    screen: Extract<RouteName, string>;
    params?: ParamList[RouteName];
  };
  const resetTo = React.useCallback(
    (index: number, routes: ResetToParams[]) => {
      navigation.reset({
        index: index,
        routes: routes.map((route) => ({
          name: route.screen as keyof ReactNavigation.RootParamList,
          params: route.params as object,
        })),
      });
    },
    [navigation],
  );
  return resetTo;
}

export function useResetToOnInvalid<
  ParamList extends ReactNavigation.RootParamList = ReactNavigation.RootParamList,
  RouteName extends keyof ParamList = keyof ParamList,
>(screen: Extract<RouteName, string>, invalid: boolean) {
  const navigation = useNavigation();
  const resetTo = useResetTo<ParamList, RouteName>();
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (invalid) {
        resetTo(screen);
      }
    });
    return unsubscribe;
  }, [invalid, navigation, resetTo]);
}

export function useOnForegroundFocus(
  onFocus: () => void,
  runOnStartup: boolean | undefined = false,
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        onFocus();
      }

      appState.current = nextAppState;
    });

    if (runOnStartup) {
      onFocus();
    }

    return () => {
      subscription?.remove();
    };
  }, []);
}
