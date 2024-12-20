import { IReferral } from '../../graphql/client/generated/graphql';

export const calculateTotals = (referrals: IReferral[]) => {
  let totalXp = 0;
  let totalEvmEarnings = 0;
  let totalSvmEarnings = 0;

  referrals.forEach((referral) => {
    totalXp += referral.pointsEarned;
    totalEvmEarnings += referral.referralRewards.estimatedEvmEarnings ?? 0;
    totalSvmEarnings += referral.referralRewards.estimatedSvmEarnings ?? 0;
  });

  return { totalXp, totalEvmEarnings, totalSvmEarnings };
};
