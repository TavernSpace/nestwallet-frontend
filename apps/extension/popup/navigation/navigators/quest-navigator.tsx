import BadgeIcon from '@nestwallet/app/assets/images/badges.svg';
import ReferralIcon from '@nestwallet/app/assets/images/referral.svg';
import SkillsIcon from '@nestwallet/app/assets/images/skills.svg';
import { adjust } from '@nestwallet/app/common/utils/style';
import { HeaderTitle } from '@nestwallet/app/components/header-title';
import { Portal } from 'react-native-paper';
import { ConnectOAuthWithData } from '../../screens/app/quest/oauth/connect';
import { QuestBadgesWithData } from '../../screens/app/quest/quest-badges';
import { QuestDetailsWithData } from '../../screens/app/quest/quest-details';
import { QuestGroupDetailsWithData } from '../../screens/app/quest/quest-group-details';
import { QuestReferralWithData } from '../../screens/app/quest/quest-referral';
import { QuestSkillsWithData } from '../../screens/app/quest/quest-skills';
import { ReferralDetailsWithData } from '../../screens/app/quest/referral-details';
import { UpdateReferralCodeWithData } from '../../screens/app/quest/update-referral-code';
import { QuestStack } from '../types';
import { getDefaultStackNavigationOptions } from './options';

export function QuestNavigator() {
  return (
    <Portal.Host>
      <QuestStack.Navigator>
        <QuestStack.Screen
          name='questGroupDetails'
          component={QuestGroupDetailsWithData}
          options={getDefaultStackNavigationOptions({ title: '' })}
        />
        <QuestStack.Screen
          name='questDetails'
          component={QuestDetailsWithData}
          options={getDefaultStackNavigationOptions({ title: '' })}
        />
        <QuestStack.Screen
          name='connectOAuth'
          component={ConnectOAuthWithData}
          options={{ headerShown: false }}
        />
        <QuestStack.Screen
          name='badges'
          component={QuestBadgesWithData}
          options={getDefaultStackNavigationOptions({
            headerTitle: () => {
              return (
                <HeaderTitle
                  title='Badges'
                  source={BadgeIcon}
                  width={adjust(20, 2)}
                  height={adjust(20, 2)}
                />
              );
            },
          })}
        />
        <QuestStack.Screen
          name='skills'
          component={QuestSkillsWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Skills',
            headerTitle: () => {
              return (
                <HeaderTitle
                  title='Skills'
                  source={SkillsIcon}
                  width={adjust(20, 2)}
                  height={adjust(20, 2)}
                />
              );
            },
          })}
        />
        <QuestStack.Screen
          name='referral'
          component={QuestReferralWithData}
          options={getDefaultStackNavigationOptions({
            title: 'Referrals',
            headerTitle: () => {
              return (
                <HeaderTitle
                  title='Referrals'
                  source={ReferralIcon}
                  width={adjust(20, 2)}
                  height={adjust(20, 2)}
                />
              );
            },
          })}
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
    </Portal.Host>
  );
}
