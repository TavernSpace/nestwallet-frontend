import * as Yup from 'yup';

export const GetSeedPhraseSchema = (seedPhraseLength: number) => {
  return Yup.object().shape({
    words: Yup.array(Yup.string()).length(seedPhraseLength),
  });
};
