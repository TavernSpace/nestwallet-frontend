import { IUser } from '@nestwallet/app/graphql/client/generated/graphql';
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as passkey from 'react-native-passkeys';
import { LargeBlobData } from './types';

const relyingParty = {
  id: 'nestwallet.xyz',
  name: 'Nest Wallet',
} satisfies PublicKeyCredentialRpEntity;

export function useIsPasskeySupportedQuery() {
  return useQuery({
    queryKey: ['isPasskeySupported'],
    queryFn: () => {
      if (Platform.OS === 'ios') {
        const majorVersionIOS = parseInt(Platform.Version as string, 10);
        // only iOS 17 and above support largeBlob
        if (majorVersionIOS < 17) {
          return false;
        }
      }
      return passkey.isSupported();
    },
  });
}

export const createPasskey = async (user: IUser) => {
  const challenge = '';
  const result = await passkey.create({
    challenge,
    pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
    rp: relyingParty,
    user: {
      id: user.id,
      displayName: user.name ?? user.email ?? 'Nest Wallet Mobile',
      name: user.name ?? user.email ?? 'Nest Wallet Mobile',
    },
    authenticatorSelection: {
      userVerification: 'required',
      residentKey: 'required',
    },
    extensions: {
      largeBlob: {
        support: 'required',
      },
    },
  });
  if (!result) {
    throw new Error('fail to create passkey');
  }
  return result;
};

export const readPasskeyBlob = async (
  credentialId: string,
): Promise<LargeBlobData> => {
  const challenge = '';
  const json = await passkey.get({
    rpId: relyingParty.id,
    challenge,
    allowCredentials: [{ id: credentialId, type: 'public-key' }],
    extensions: { largeBlob: { read: true } },
  });
  const blob = json?.clientExtensionResults?.largeBlob?.blob;
  if (!blob) {
    throw new Error('cannot find any data');
  }
  const dataJson = new TextDecoder().decode(Buffer.from(blob, 'base64'));
  return JSON.parse(dataJson) as LargeBlobData;
};

export const writePasskeyBlob = async (
  credentialId: string,
  data: LargeBlobData,
) => {
  const challenge = '';
  const largeBlob = Buffer.from(JSON.stringify(data)).toString('base64');
  return await passkey.get({
    rpId: relyingParty.id,
    challenge,
    allowCredentials: [{ id: credentialId, type: 'public-key' }],
    extensions: {
      largeBlob: {
        write: largeBlob,
      },
    },
  });
};
