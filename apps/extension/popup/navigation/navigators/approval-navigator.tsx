import { View } from '@nestwallet/app/components/view';
import { SCREEN_WIDTH } from '@nestwallet/app/design/constants';
import { getPathFromState } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import cn from 'classnames';
import { useMemo } from 'react';
import { AuthorizedUserContextProvider } from '../../provider/user/auth';
import { ApprovalConnectionWithData } from '../../screens/approval/connection';
import { ApprovalMessageWithData } from '../../screens/approval/message';
import { ApprovalTransactionWithData } from '../../screens/approval/transaction';
import { useOverlayDimension } from '../../screens/approval/utils';
import { ApprovalStack, RootStackParamList } from '../types';

type RouteProps = StackScreenProps<RootStackParamList, 'approval'>;

export function ApprovalNavigator({ route, navigation }: RouteProps) {
  const state = navigation.getState();
  const url = useMemo(() => {
    const screen = route.params?.screen;
    const payload = route.params?.params?.payload;
    if (screen && payload) {
      return `/approval/${screen}?payload=${payload}`;
    } else {
      return getPathFromState(state);
    }
  }, []);
  const { overlayDimensions, widthLimit, handleLayout } = useOverlayDimension();

  return (
    <View
      className='flex flex-1 items-center justify-center overflow-hidden bg-black'
      onLayout={handleLayout}
    >
      <View
        className={cn('bg-background overflow-hidden', {
          'border-card border': overlayDimensions.width >= widthLimit,
        })}
        style={[
          overlayDimensions,
          {
            borderRadius: (overlayDimensions.width - SCREEN_WIDTH) * 1.5,
          },
        ]}
      >
        <AuthorizedUserContextProvider redirect={url}>
          <ApprovalStack.Navigator>
            <ApprovalStack.Screen
              name='connection'
              component={ApprovalConnectionWithData}
              options={{
                animationEnabled: true,
                headerShown: false,
              }}
            />
            <ApprovalStack.Screen
              name='transaction'
              component={ApprovalTransactionWithData}
              options={{
                animationEnabled: true,
                headerShown: false,
              }}
            />
            <ApprovalStack.Screen
              name='message'
              component={ApprovalMessageWithData}
              options={{
                animationEnabled: true,
                headerShown: false,
              }}
            />
          </ApprovalStack.Navigator>
        </AuthorizedUserContextProvider>
      </View>
    </View>
  );
}
