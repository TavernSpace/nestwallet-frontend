import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

export const WalletDetailsTab =
  createMaterialTopTabNavigator<WalletDetailsTabParamList>();

export type WalletDetailsTabParamList = {
  home: undefined;
  browser: undefined;
  transactions: undefined;
  rewards: undefined;
  discover: undefined;
};
