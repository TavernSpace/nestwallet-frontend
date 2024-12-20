import { delay } from '../../../common/api/utils';
import { IKeyring, Tuple } from '../../../common/types';
import { generateSeedPhrase } from '../../../features/wallet/seedphrase';
import {
  IBlockchainType,
  IUpsertWalletInput,
  IUserAccount,
  IWalletType,
} from '../../../graphql/client/generated/graphql';
import {
  getEvmAddressesFromSeedPhrase,
  getSvmAddressesFromSeedPhrase,
  getTvmAddressesFromSeedPhrase,
} from '../choose-addresses/seedphrase-fetcher';

export async function generateQuickStartWallets(
  accounts: IUserAccount[],
  input: Tuple<[string, boolean], 3>,
) {
  const account = accounts.find((account) => account.isDefault)!;
  const seed = generateSeedPhrase().join(' ');
  await delay(50);
  const evm = input[0][1]
    ? await generateEvmWallet(account, seed, input[0][0])
    : undefined;
  await delay(50);
  const svm = input[1][1]
    ? await generateSvmWallet(account, seed, input[1][0])
    : undefined;
  await delay(50);
  const tvm = input[2][1]
    ? await generateTvmWallet(account, seed, input[2][0])
    : undefined;
  return {
    evm,
    svm,
    tvm,
  };
}

async function generateEvmWallet(
  account: IUserAccount,
  seed: string,
  name: string,
) {
  const evmWalletsAddresses = await getEvmAddressesFromSeedPhrase(seed, 0, 1);
  const evmWalletsData = evmWalletsAddresses.wallets[0]!.data;
  const keyringIdentifier = evmWalletsData.address;
  const evmKeyring: IKeyring = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Evm,
    keyringIdentifier,
    value: seed,
  };
  const evmUpsertWalletInput: IUpsertWalletInput = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Evm,
    name: name,
    organizationId: account.organization.id,
    address: evmWalletsData.address,
    chainId: 0,
    derivationPath: evmWalletsData.derivationPath,
    keyringIdentifier: evmKeyring.keyringIdentifier,
  };
  return { keyring: evmKeyring, input: evmUpsertWalletInput };
}

async function generateSvmWallet(
  account: IUserAccount,
  seed: string,
  name: string,
) {
  const svmWalletsAddresses = await getSvmAddressesFromSeedPhrase(seed, 0, 1);
  const svmWalletsData = svmWalletsAddresses.wallets[0]!.data;
  const keyringIdentifier = svmWalletsData.address;
  const svmKeyring: IKeyring = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Svm,
    keyringIdentifier,
    value: seed,
  };
  const svmUpsertWalletInput: IUpsertWalletInput = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Svm,
    name: name,
    organizationId: account.organization.id,
    address: svmWalletsData.address,
    chainId: 0,
    derivationPath: svmWalletsData.derivationPath,
    keyringIdentifier: svmKeyring.keyringIdentifier,
  };
  return { keyring: svmKeyring, input: svmUpsertWalletInput };
}

async function generateTvmWallet(
  account: IUserAccount,
  seed: string,
  name: string,
) {
  const tvmWalletsAddresses = await getTvmAddressesFromSeedPhrase(seed, 0, 1);
  const tvmWalletsData = tvmWalletsAddresses.wallets[0]!.data;
  const keyringIdentifier = tvmWalletsData.address;
  const tvmKeyring: IKeyring = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Tvm,
    keyringIdentifier,
    value: seed,
  };
  const tvmUpsertWalletInput: IUpsertWalletInput = {
    type: IWalletType.SeedPhrase,
    blockchain: IBlockchainType.Tvm,
    name: name,
    organizationId: account.organization.id,
    address: tvmWalletsData.address,
    chainId: 0,
    derivationPath: tvmWalletsData.derivationPath,
    keyringIdentifier: tvmKeyring.keyringIdentifier,
    version: 'V4',
  };
  return { keyring: tvmKeyring, input: tvmUpsertWalletInput };
}
