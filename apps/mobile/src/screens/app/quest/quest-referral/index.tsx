import { ReferralSectionWithQuery } from '@nestwallet/app/screens/wallet-details/rewards/referral-section/query';
import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { QuestStackParamList } from '../../../../navigation/types';
import { useUserContext } from '../../../../provider/user';
import { withUserContext } from '../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'referral'>;

export const QuestReferralWithData = withUserContext(_QuestReferralWithData);

function _QuestReferralWithData({ route }: RouteProps) {
  const { user } = useUserContext();
  const navigation = useNavigation();

  const handleEditReferralCodePressed = () => {
    navigation.navigate('app', {
      screen: 'quest',
      params: {
        screen: 'updateReferralCode',
      },
    });
  };

  const handleMoreDetailsAction = () => {
    navigation.navigate('app', {
      screen: 'quest',
      params: {
        screen: 'referralDetails',
      },
    });
  };

  const handleNavigateBack = () => {
    navigation.goBack();
  };

  return (
    <ReferralSectionWithQuery
      user={user}
      onEditReferralCodePressed={handleEditReferralCodePressed}
      onMoreDetailsAction={handleMoreDetailsAction}
      onNavigateBack={handleNavigateBack}
    />
  );
}
