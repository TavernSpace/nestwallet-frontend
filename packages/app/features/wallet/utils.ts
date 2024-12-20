import {
  IBlockchainType,
  IDeviceType,
  IUserAccount,
  IWalletDeploymentStatus,
} from '@nestwallet/app/graphql/client/generated/graphql';
import { Platform } from 'react-native';
import { ISignerWallet, KeyringsMetadata } from '../../common/types';
import {
  IUser,
  IWallet,
  IWalletType,
} from '../../graphql/client/generated/graphql';

export const WalletTypePrefixes = {
  [IWalletType.Safe]: 'Safe',
  [IWalletType.SeedPhrase]: 'Seed',
  [IWalletType.Ledger]: 'Ledger',
  [IWalletType.Trezor]: 'Trezor',
  [IWalletType.PrivateKey]: 'Wallet',
};

export async function getWalletsWithMetadata(
  user: IUser,
  keyringsMetadata: KeyringsMetadata,
): Promise<ISignerWallet[]> {
  const personalAccount = user.accounts.find(
    (account) => account.organization.isDefault,
  );
  const personalSigners: IWallet[] =
    (personalAccount?.organization.wallets.filter(
      (wallet) => wallet.type !== IWalletType.Safe,
    ) as IWallet[]) ?? [];
  return personalSigners.map((wallet) => {
    const metadata = wallet.keyringIdentifier
      ? keyringsMetadata[wallet.keyringIdentifier]
      : undefined;
    const hasKeyringMaterial =
      wallet.type === IWalletType.SeedPhrase ||
      wallet.type === IWalletType.PrivateKey;

    const hasKeyring = !hasKeyringMaterial || metadata?.type === wallet.type;
    return { ...wallet, hasKeyring };
  });
}

export function getSafeCount(accounts: IUserAccount[]) {
  const organizationWalletsArray = accounts.filter(
    (account) => account.organization.wallets.length > 0,
  );
  let safeCount = 0;
  for (const organizationWallets of organizationWalletsArray) {
    safeCount += organizationWallets.organization.wallets.length;
  }
  return safeCount;
}

export function deviceType(): IDeviceType {
  return Platform.OS === 'web' ? IDeviceType.Browser : IDeviceType.Mobile;
}

export function otherDeviceType(): IDeviceType {
  return Platform.OS === 'web' ? IDeviceType.Mobile : IDeviceType.Browser;
}

export function isHardwareWallet(wallet: IWallet) {
  return (
    wallet.type === IWalletType.Ledger || wallet.type === IWalletType.Trezor
  );
}

export function isSafe(wallet: IWallet) {
  return wallet.type === IWalletType.Safe;
}

export function isValidSigner(signer?: ISignerWallet | null) {
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  if (!signer) {
    return false;
  } else if (!signer.hasKeyring) {
    return false;
  } else if (isMobile && isHardwareWallet(signer)) {
    return false;
  }
  return true;
}

export function getValidSigners(
  signers: ISignerWallet[],
  blockchain: IBlockchainType,
) {
  return signers.filter(
    (signer) =>
      isValidSigner(signer) && signer.blockchain === IBlockchainType.Evm,
  );
}

export function isViewOnlyWallet(wallet: ISignerWallet) {
  const isSafe = wallet.type === IWalletType.Safe;
  const isDeployed =
    wallet.deploymentStatus === IWalletDeploymentStatus.Deployed;
  const isMobileHardware = Platform.OS !== 'web' && isHardwareWallet(wallet);
  const canTransact =
    (isSafe && isDeployed) || (wallet.hasKeyring && !isMobileHardware);
  return !canTransact;
}
