import * as Yup from 'yup';

export const IReferralCodeSchema = Yup.object({
  referralCode: Yup.string()
    .matches(/^[A-Z0-9]+$/, 'Only uppercase letters and numbers are allowed.')
    .min(4, 'Referral code must be at least 4 characters long.')
    .max(12, 'Referral code must be no more than 12 characters long.')
    .required(),
});
