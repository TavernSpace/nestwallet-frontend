import { faDiscord, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { useMutationEmitter } from '@nestwallet/app/common/hooks/query';
import { parseError } from '@nestwallet/app/features/errors';
import {
  IOAuthProvider,
  IUserIdentityType,
  useCreateOauthIdentityMutation,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { graphqlType } from '@nestwallet/app/graphql/types';
import {
  ShowSnackbarSeverity,
  useSnackbar,
} from '@nestwallet/app/provider/snackbar';
import { ConnectOAuth } from '@nestwallet/app/screens/wallet-details/rewards/connect';
import { OAuthResult } from '@nestwallet/app/screens/wallet-details/rewards/oauth-result-screen';
import { StackScreenProps } from '@react-navigation/stack';
import { useState } from 'react';
import { QuestStackParamList } from '../../../../../navigation/types';
import { useAppContext } from '../../../../../provider/application';
import { withUserContext } from '../../../../../provider/user/wrapper';

type RouteProps = StackScreenProps<QuestStackParamList, 'connectOAuth'>;

export const ConnectOAuthWithData = withUserContext(_ConnectOAuthWithData);

function _ConnectOAuthWithData({ route, navigation }: RouteProps) {
  const { walletService } = useAppContext();
  const { oAuthProvider } = route.params;
  const { showSnackbar } = useSnackbar();
  const [status, setStatus] = useState<
    'none' | 'loading' | 'success' | 'failure'
  >('none');

  const createOauthIdentityMutation = useMutationEmitter(
    graphqlType.UserIdentity,
    useCreateOauthIdentityMutation(),
  );

  const handleConnectOauth = async () => {
    try {
      setStatus('loading');
      const { code, codeVerifier, redirectUri } =
        await walletService.getOAuthCode(oAuthProvider);
      await createOauthIdentityMutation.mutateAsync({
        input: {
          oauthProvider: oAuthProvider,
          oauthToken: code,
          codeVerifier: codeVerifier,
          redirectURI: redirectUri,
          type: IUserIdentityType.Oauth,
        },
      });
      setStatus('success');
    } catch (err) {
      const error = parseError(err);
      if (error.message === 'connected to other account') {
        showSnackbar({
          severity: ShowSnackbarSeverity.error,
          message: oAuthProvider + ' is already connected to another account.',
        });
      }
      setStatus('failure');
    }
  };

  if (status === 'none') {
    return (
      <ConnectOAuth
        hasPageHeader={false}
        handleConnectOauth={handleConnectOauth}
        oAuthProvider={oAuthProvider}
        oAuthlogo={
          oAuthProvider === IOAuthProvider.Twitter ? faTwitter : faDiscord
        }
      />
    );
  }
  return (
    <OAuthResult
      status={status}
      oAuthProvider={oAuthProvider}
      oAuthlogo={
        oAuthProvider === IOAuthProvider.Twitter ? faTwitter : faDiscord
      }
    />
  );
}
