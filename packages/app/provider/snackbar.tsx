import cn from 'classnames';
import { Audio } from 'expo-av';
import React, { createContext, useContext, useMemo, useState } from 'react';
import { opaque } from '../common/utils/functions';
import { BaseButton } from '../components/button/base-button';
import { Snackbar } from '../components/snackbar';
import { Text } from '../components/text';
import { View } from '../components/view';
import { colors } from '../design/constants';
import {
  NotificationFeedbackType,
  notificationAsync,
} from '../features/haptic';

export enum ShowSnackbarSeverity {
  success,
  error,
}

export interface ShowSnackbarProps {
  message?: React.ReactNode;
  severity?: ShowSnackbarSeverity;
  customChildren?: React.ReactNode;
  sound?: Audio.Sound;
  onPress?: VoidFunction;
}

interface ISnackbarContext {
  showSnackbar: (props: ShowSnackbarProps) => void;
}

export const SnackbarContext = createContext<ISnackbarContext>({} as any);

export function SnackbarContextProvider(props: {
  ignoreInset?: boolean;
  children: React.ReactNode;
}) {
  const [isShowing, setIsShowing] = useState(false);
  const [snackbarChildren, setSnackbarChildren] = useState<React.ReactNode>();
  const [bgColor, setBgColor] = useState('');
  const [textColor, setTextColor] = useState('');

  const showSnackbar = (props: ShowSnackbarProps) => {
    switch (props.severity) {
      case ShowSnackbarSeverity.success: {
        notificationAsync(NotificationFeedbackType.Success);
        setSnackbarChildren(
          <BaseButton className='flex flex-1 flex-col' onPress={props.onPress}>
            {props.message ? (
              <View className='justify-center py-4'>
                <Text
                  className={cn('text-success flex-wrap text-sm font-medium', {
                    underline: props.onPress,
                  })}
                >
                  {props.message}
                </Text>
              </View>
            ) : props.customChildren ? (
              <>{props.customChildren}</>
            ) : null}
          </BaseButton>,
        );
        setBgColor(opaque(colors.success, colors.background, 10));
        setTextColor(colors.success);
        break;
      }
      case ShowSnackbarSeverity.error: {
        notificationAsync(NotificationFeedbackType.Error);
        setSnackbarChildren(
          props.message ? (
            <BaseButton
              className='flex flex-1 flex-col'
              onPress={props.onPress}
            >
              <View className='justify-center py-4'>
                <Text
                  className={cn('text-failure flex-wrap text-sm font-medium', {
                    underline: props.onPress,
                  })}
                >
                  {props.message}
                </Text>
              </View>
            </BaseButton>
          ) : props.customChildren ? (
            <>{props.customChildren}</>
          ) : null,
        );
        setBgColor(opaque(colors.failure, colors.background, 10));
        setTextColor(colors.failure);
        break;
      }
    }
    props.sound?.replayAsync();
    setIsShowing(true);
  };

  const context = useMemo(() => ({ showSnackbar }), []);

  return (
    <SnackbarContext.Provider value={context}>
      {props.children}
      <Snackbar
        isShowing={isShowing}
        duration={4000}
        snackbarStyle={{ backgroundColor: bgColor }}
        closeIconColor={textColor}
        ignoreInset={props.ignoreInset}
        onClose={() => setIsShowing(false)}
      >
        {snackbarChildren}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}
