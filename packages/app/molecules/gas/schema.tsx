import * as Yup from 'yup';

export const CustomGasSchema = Yup.object().shape({
  fee: Yup.number().positive().moreThan(0).required('Enter a valid fee amount'),
});

export const JitoTipSchema = Yup.object().shape({
  tip: Yup.number().positive().min(0.0001).required('Enter a valid tip amount'),
});
