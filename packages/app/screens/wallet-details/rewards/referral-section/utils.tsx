import { IUser } from '../../../../graphql/client/generated/graphql';

export const getReferralLink = (user: IUser): string => {
  const baseUrl = 'https://nestwallet.xyz/?referral=';
  return `${baseUrl}${user.referralCode}`;
};
