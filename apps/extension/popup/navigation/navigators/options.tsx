import { faChevronLeft, faTimes } from '@fortawesome/pro-regular-svg-icons';
import { useNavigationOptions } from '@nestwallet/app/common/hooks/navigation';
import { IApproveInput } from '@nestwallet/app/common/types';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { Text } from '@nestwallet/app/components/text';
import { colors } from '@nestwallet/app/design/constants';
import { IBlockchainType } from '@nestwallet/app/graphql/client/generated/graphql';
import { useNavigation } from '@react-navigation/native';
import {
  CardStyleInterpolators,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  StackNavigationOptions,
  StackNavigationProp,
  StackScreenProps,
} from '@react-navigation/stack';
import { Animated } from 'react-native';
import { useAppContext } from '../../provider/application';
import { DappData } from '../types';

type HeaderOptionsFn = (props: {
  navigation: StackNavigationProp<ReactNavigation.RootParamList>;
}) => StackNavigationOptions;

export const defaultStackNavigationOptions: StackNavigationOptions = {
  animationEnabled: true,
  headerTitleAlign: 'center',
  headerShadowVisible: false,
  headerStyle: {
    backgroundColor: colors.background,
    height: 56,
  },
  headerTitleContainerStyle: {
    paddingTop: 10,
  },
  headerLeftContainerStyle: {
    paddingTop: 10,
    paddingLeft: 16,
  },
  headerRightContainerStyle: {
    paddingTop: 10,
    paddingRight: 16,
  },
  headerTitleStyle: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Aeonik',
    fontWeight: '500',
  },
};

interface NavigationOptions extends Partial<StackNavigationOptions> {
  titleLeft?: string;
}

export const getDefaultStackNavigationOptions = (
  options?: NavigationOptions,
): HeaderOptionsFn => {
  return (props): StackNavigationOptions => {
    const { navigation } = props;
    const newOptions = {
      ...defaultStackNavigationOptions,
      ...options,
    };
    if (newOptions.titleLeft) {
      newOptions.title = '';
      newOptions.headerLeft = () => (
        <Text className='text-text-primary text-xl font-medium'>Send</Text>
      );
    } else if (!options?.headerLeft) {
      newOptions.headerLeft = () => {
        return (
          navigation.canGoBack() && (
            <IconButton
              icon={faChevronLeft}
              size={18}
              onPress={navigation.goBack}
              color={colors.textPrimary}
            />
          )
        );
      };
    }
    return newOptions;
  };
};

export function getModalStackNavigationOptions(
  props: StackScreenProps<any>,
): StackNavigationOptions {
  return {
    ...defaultStackNavigationOptions,
    cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
    headerMode: 'float',
    headerRight: props.navigation.canGoBack()
      ? () => (
          <IconButton
            icon={faTimes}
            size={20}
            onPress={props.navigation.goBack}
            color={colors.textPrimary}
          />
        )
      : () => null,
  };
}

export function useInternalApprovalModalStackNavigationOptions(
  input: IApproveInput,
  message: string,
) {
  const { walletService } = useAppContext();
  const navigation = useNavigation();

  const handleCancel = async () => {
    await walletService.resolveApproval({
      requestId: input.requestId,
      tabId: input.tabId,
      blockchain: input.blockchain,
      error: message,
    });
    navigation.goBack();
  };

  useNavigationOptions({
    headerRight: () => (
      <IconButton
        icon={faTimes}
        size={20}
        onPress={handleCancel}
        color={colors.textPrimary}
      />
    ),
  });
}

export function useInternalTransactionApprovalModalStackNavigationOptions(
  data: DappData | undefined,
  message: string,
) {
  const { walletService } = useAppContext();
  const navigation = useNavigation();

  const handleCancel = async (dappData: DappData) => {
    await walletService.resolveApproval({
      requestId: dappData.requestId,
      tabId: dappData.tabId,
      blockchain: IBlockchainType.Evm,
      error: message,
    });
    navigation.getParent()?.goBack();
  };

  useNavigationOptions(
    data && data.isInternal
      ? {
          headerRight: () => (
            <IconButton
              icon={faTimes}
              size={20}
              onPress={() => handleCancel(data)}
              color={colors.textPrimary}
            />
          ),
        }
      : {},
  );
}

export function defaultModalInterpolator({
  index,
  current,
  next,
  inverted,
  layouts: { screen },
  insets,
}: StackCardInterpolationProps): StackCardInterpolatedStyle {
  const topOffset = 10;
  const aspectRatio = screen.height / screen.width;

  const progress = Animated.add(
    current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
    next
      ? next.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: 'clamp',
        })
      : 0,
  );

  const isFirst = index === 0;

  const translateY = Animated.multiply(
    progress.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [
        screen.height,
        isFirst ? 0 : topOffset,
        (isFirst ? insets.top : 0) - topOffset * aspectRatio,
      ],
    }),
    inverted,
  );

  const overlayOpacity = progress.interpolate({
    inputRange: [0, 1, 1.0001, 2],
    outputRange: [0, 0.3, 1, 1],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1, screen.width ? 1 - (topOffset * 2) / screen.width : 1],
  });

  const borderRadius = isFirst
    ? progress.interpolate({
        inputRange: [0, 1, 1.0001, 2],
        outputRange: [0, 0, 0, 24],
      })
    : 24;

  return {
    cardStyle: {
      overflow: 'hidden',
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
      // We don't need these for the animation
      // But different border radius for corners improves animation perf
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      marginTop: insets.top,
      marginBottom: isFirst ? 0 : topOffset,
      transform: [{ translateY }, { scale }],
    },
    overlayStyle: { opacity: overlayOpacity },
  };
}
