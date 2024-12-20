import { Platform } from 'react-native';
import {
  MD3LightTheme as DefaultTheme,
  MD3Theme,
  configureFonts,
} from 'react-native-paper';
import { colors } from '../constants';

const baseVariants = configureFonts({
  config: {
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_400Regular',
    }),
  },
});

// https://callstack.github.io/react-native-paper/docs/guides/fonts/
// for all variants wiht fontWeight != 400, we need to override
const customVariants = {
  titleSmall: {
    ...baseVariants.titleSmall,
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_500Medium',
    }),
  },
  titleMedium: {
    ...baseVariants.titleMedium,
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_500Medium',
    }),
  },
  labelSmall: {
    ...baseVariants.labelSmall,
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_500Medium',
    }),
  },
  labelMedium: {
    ...baseVariants.labelMedium,
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_500Medium',
    }),
  },
  labelLarge: {
    ...baseVariants.labelLarge,
    fontFamily: Platform.select({
      web: 'Aeonik',
      default: 'Aeonik_500Medium',
    }),
  },
} as const;

const fonts = configureFonts({
  config: {
    ...baseVariants,
    ...customVariants,
  },
});

export const theme: MD3Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
  },
  fonts,
};
