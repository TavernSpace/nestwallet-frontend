import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { getOAuthProviderConfig } from '@nestwallet/app/features/oauth/utils';
import {
  IOAuthProvider,
  IUserIdentityType,
  useCreateOauthIdentityMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import { ConnectOAuth } from '@nestwallet/app/screens/wallet-details/rewards/connect';
import { StackScreenProps } from '@react-navigation/stack';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { maybeCompleteAuthSession } from 'expo-web-browser';
import { QuestStackParamList } from '../../../../../navigation/types';
import { withUserContext } from '../../../../../provider/user/wrapper';

maybeCompleteAuthSession();

type RouteProps = StackScreenProps<QuestStackParamList, 'connectOAuth'>;

export const ConnectOAuthWithData = withUserContext(_ConnectOAuthWithData);

function _ConnectOAuthWithData({ route, navigation }: RouteProps) {
  const { oAuthProvider } = route.params;

  const config = getOAuthProviderConfig(oAuthProvider);

  const redirectUri = makeRedirectUri({
    scheme: 'nestwallet',
    path: 'oauth2',
  });

  const createOauthIdentityMutation = useMutationEmitter(
    [graphqlType.UserIdentity, graphqlType.Quests],
    useCreateOauthIdentityMutation(),
  );

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: config.clientId,
      redirectUri: redirectUri,
      usePKCE: true,
      scopes: config.scopes,
      codeChallenge: 'plain',
    },
    config.discovery,
  );

  const handleConnectOauth = async () => {
    const response = await promptAsync();
    if (response.type === 'success') {
      await createOauthIdentityMutation.mutateAsync({
        input: {
          oauthProvider: oAuthProvider,
          oauthToken: response.params.code,
          codeVerifier: request?.codeVerifier,
          redirectURI: redirectUri,
          type: IUserIdentityType.Oauth,
        },
      });
      navigation.pop();
    }
  };

  return (
    <ConnectOAuth
      hasPageHeader={true}
      handleConnectOauth={handleConnectOauth}
      oAuthProvider={oAuthProvider}
      oAuthlogo={
        oAuthProvider === IOAuthProvider.Twitter ? faTwitter : faDiscord
      }
    />
  );
}
