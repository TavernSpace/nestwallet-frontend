import * as Yup from 'yup';

export const SwapSettingsSchema = Yup.object().shape({
  slippage: Yup.number()
    .typeError('Amount must be a valid number')
    .required('Please enter a valid amount')
    .min(0, 'Slippage can be no less than 0%')
    .max(100, 'Slippage can be no more than 100%'),
  tip: Yup.number()
    .min(0)
    .test('test-min-0.0001', 'Tip must be at least 0.0001 SOL', (value) =>
      value === undefined ? true : value === 0 ? true : value >= 0.0001,
    ),
});
