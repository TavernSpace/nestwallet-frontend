import BadgeIcon from '@nestwallet/app/assets/images/badges.svg';
import ReferralIcon from '@nestwallet/app/assets/images/referral.svg';
import SkillsIcon from '@nestwallet/app/assets/images/skills.svg';
import { adjust } from '@nestwallet/app/common/utils/style';
import { HeaderWithTitle } from '@nestwallet/app/components/header-title';
import { PortalProvider } from '@nestwallet/app/provider/portal';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import {
  getDefaultStackNavigationOptions,
  getModalStackNavigationOptions,
} from '../common/header/utils';
import { ConnectOAuthWithData } from '../screens/app/quest/oauth/connect';
import { QuestBadgesWithData } from '../screens/app/quest/quest-badges';
import { QuestDetailsWithData } from '../screens/app/quest/quest-details';
import { QuestGroupDetailsWithData } from '../screens/app/quest/quest-group-details';
import { QuestReferralWithData } from '../screens/app/quest/quest-referral';
import { QuestSkillsWithData } from '../screens/app/quest/quest-skills';
import { ReferralDetailsWithData } from '../screens/app/quest/referral-details';
import { UpdateReferralCodeWithData } from '../screens/app/quest/update-referral-code';
import { AppStackParamList, QuestStack } from './types';

type RouteProps = NativeStackScreenProps<AppStackParamList, 'quest'>;

export function QuestNavigator(props: RouteProps) {
  return (
    <PortalProvider type={Platform.OS === 'ios' ? 'full' : 'none'}>
      <QuestStack.Navigator
        screenOptions={getModalStackNavigationOptions(props)}
      >
        <QuestStack.Screen
          name='questGroupDetails'
          component={QuestGroupDetailsWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <QuestStack.Screen
          name='questDetails'
          component={QuestDetailsWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        {/* twitter */}
        <QuestStack.Screen
          name='connectOAuth'
          component={ConnectOAuthWithData}
          options={getDefaultStackNavigationOptions({
            title: '',
          })}
        />
        <QuestStack.Screen
          name='badges'
          component={QuestBadgesWithData}
          options={{
            header: () => (
              <HeaderWithTitle
                title='Badges'
                source={BadgeIcon}
                width={adjust(20, 2)}
                height={adjust(20, 2)}
                onBack={props.navigation.goBack}
              />
            ),
          }}
        />
        <QuestStack.Screen
          name='skills'
          component={QuestSkillsWithData}
          options={{
            header: () => (
              <HeaderWithTitle
                title='Skills'
                source={SkillsIcon}
                width={adjust(20, 2)}
                height={adjust(20, 2)}
                onBack={props.navigation.goBack}
              />
            ),
          }}
        />
        <QuestStack.Screen
          name='referral'
          component={QuestReferralWithData}
          options={{
            header: () => (
              <HeaderWithTitle
                title='Referrals'
                source={ReferralIcon}
                width={adjust(20, 2)}
                height={adjust(20, 2)}
                onBack={props.navigation.goBack}
              />
            ),
          }}
        />
        <QuestStack.Screen
          name='updateReferralCode'
          component={UpdateReferralCodeWithData}
          options={getDefaultStackNavigationOptions({ title: '' })}
        />
        <QuestStack.Screen
          name='referralDetails'
          component={ReferralDetailsWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Referral Details',
          })}
        />
      </QuestStack.Navigator>
    </PortalProvider>
  );
}
