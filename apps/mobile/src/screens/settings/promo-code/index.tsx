import { PromoCodeScreenWithQuery } from '@nestwallet/app/screens/settings/promo-code/query';
import { StackScreenProps } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'promocode'>;

export const PromoCodeWithData = withUserContext(_PromoCodeWithData);

function _PromoCodeWithData({ route }: RouteProps) {
  return <PromoCodeScreenWithQuery />;
}
