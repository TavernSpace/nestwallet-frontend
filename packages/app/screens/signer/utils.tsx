import { SecretType } from './reveal-key/types';

export function secretTypeToLabel(secret: SecretType) {
  return secret === 'seed' ? 'Seed Phrase' : 'Private Key';
}
