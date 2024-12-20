import { Theme } from '@react-navigation/native';
import { colors } from '../constants';

export const NavigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.background,
    text: colors.textPrimary,
    border: colors.cardHighlight,
    notification: colors.failure,
  },
};
