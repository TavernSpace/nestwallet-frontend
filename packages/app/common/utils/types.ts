import {
  ICryptoBalance,
  INftBalance,
  IWalletType,
} from '../../graphql/client/generated/graphql';

export function isCryptoBalance(
  balance: ICryptoBalance | INftBalance,
): balance is ICryptoBalance {
  return 'tokenMetadata' in balance;
}

export function convertWalletTypeToLabel(type: IWalletType): string {
  const walletType =
    type === IWalletType.SeedPhrase
      ? 'Seed Phrase'
      : type === IWalletType.PrivateKey
      ? 'Private Key'
      : type === IWalletType.Ledger
      ? 'Ledger'
      : type === IWalletType.Trezor
      ? 'Trezor'
      : 'Safe';

  return walletType;
}
