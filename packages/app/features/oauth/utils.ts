import { IS_PRODUCTION } from '../../common/api/nestwallet/utils';
import { IOAuthProvider } from '../../graphql/client/generated/graphql';

interface OAuthProviderConfig {
  clientId: string;
  scopes: string[];
  discovery: {
    authorizationEndpoint: string;
    tokenEndpoint: string;
    revocationEndpoint: string;
  };
}

const oAuthProviderName: Record<IOAuthProvider, string> = {
  [IOAuthProvider.Twitter]: 'Twitter',
  [IOAuthProvider.Discord]: 'Discord',
};

const config: Record<IOAuthProvider, OAuthProviderConfig> = {
  [IOAuthProvider.Twitter]: {
    clientId: IS_PRODUCTION
      ? 'Rnp2bDVjR0NiVVhhSUlIZlVyRms6MTpjaQ'
      : 'SVZPRV9GZlBGVzJsQl9rSWYtWXo6MTpjaQ',
    scopes: ['follows.read', 'tweet.read', 'users.read'],
    discovery: {
      authorizationEndpoint: 'https://twitter.com/i/oauth2/authorize',
      tokenEndpoint: 'https://twitter.com/i/oauth2/token',
      revocationEndpoint: 'https://twitter.com/i/oauth2/revoke',
    },
  },
  [IOAuthProvider.Discord]: {
    clientId: IS_PRODUCTION ? '1216393030584635519' : '1216554396801040425',
    scopes: ['identify', 'guilds', 'guilds.members.read'],
    discovery: {
      authorizationEndpoint: 'https://discord.com/oauth2/authorize',
      tokenEndpoint: 'https://discord.com/oauth2/token',
      revocationEndpoint: 'https://discord.com/oauth2/revoke',
    },
  },
};

export function getOAuthProviderConfig(
  provider: IOAuthProvider,
): OAuthProviderConfig {
  return config[provider];
}

export function getOAuthProviderName(provider: IOAuthProvider): string {
  return oAuthProviderName[provider];
}
