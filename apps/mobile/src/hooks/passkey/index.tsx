import { IUser } from '@nestwallet/app/graphql/client/generated/graphql';
import type { AuthenticationResponseJSON } from '@simplewebauthn/typescript-types';
import { useQuery } from '@tanstack/react-query';
import { LargeBlobData, RegistrationResponseJSON } from './types';

export function useIsPasskeySupportedQuery() {
  return useQuery({
    queryKey: ['isPasskeySupported'],
    queryFn: () => false,
  });
}

export const createPasskey = async (
  user: IUser,
): Promise<RegistrationResponseJSON> => {
  throw new Error('unsupported');
};

export const readPasskeyBlob = async (
  credentialId: string,
): Promise<LargeBlobData> => {
  throw new Error('unsupported');
};

export const writePasskeyBlob = (
  credentialId: string,
  data: LargeBlobData,
): Promise<AuthenticationResponseJSON | null> => {
  throw new Error('unsupported');
};
