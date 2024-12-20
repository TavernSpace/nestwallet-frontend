import { useResetToOnInvalid } from '@nestwallet/app/common/hooks/navigation';
import { RevealKeyWithQuery } from '@nestwallet/app/screens/signer/reveal-key/query';
import { StackScreenProps } from '@react-navigation/stack';
import { useSignerById } from '../../../hooks/signer';
import { SettingsStackParamList } from '../../../navigation/types';
import { withUserContext } from '../../../provider/user/wrapper';

type RouteProps = StackScreenProps<SettingsStackParamList, 'revealKey'>;

export const RevealKeyWithData = withUserContext(_RevealKeyWithData);

function _RevealKeyWithData({ route, navigation }: RouteProps) {
  const { walletId, data, secretType } = route.params;
  const { signer } = useSignerById(walletId);
  useResetToOnInvalid('app', !signer);

  const handleBackPress = () => {
    navigation.getParent()?.goBack();
  };

  return signer ? (
    <RevealKeyWithQuery
      signer={signer}
      secretType={secretType}
      data={data}
      onBack={handleBackPress}
    />
  ) : null;
}
