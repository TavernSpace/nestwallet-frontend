import { SeedPhraseInput } from '../../../common/types';

export function convertSeedPhraseToString(seedPhrase: SeedPhraseInput) {
  const words = seedPhrase.words.map((word) => word.toLocaleLowerCase());
  const seed = words.join(' ');
  return seed;
}
