import { Wallet, ethers } from 'ethers';
import _ from 'lodash';
import { IKeyring, IPersonalWallet } from '../../common/types';
import { IWalletType } from '../../graphql/client/generated/graphql';
import { createEvmWalletFromSeed } from '../wallet/seedphrase';
import { TypedData } from './types';

// EIP-191 compliant signature
export async function signEvmMessageWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  message: string | Uint8Array,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];

  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const wallet = await createEvmWalletFromSeed(
      keyring.value,
      personalWallet.derivationPath,
    );
    return wallet.signMessage(message);
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const wallet = new Wallet(keyring.value);
    return wallet.signMessage(message);
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}

export async function signEvmTypedDataWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  typedData: TypedData,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];
  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  // ethers expects us to remove EIP712Domain
  const { domain, message } = typedData;
  const types = _.omit(typedData.types, 'EIP712Domain');
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const wallet = await createEvmWalletFromSeed(
      keyring.value,
      personalWallet.derivationPath,
    );
    return wallet.signTypedData(domain, types, message);
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const wallet = new Wallet(keyring.value);
    return wallet.signTypedData(domain, types, message);
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}

export async function signEvmTransactionWithKeystore(
  keyrings: Record<string, IKeyring>,
  personalWallet: IPersonalWallet,
  transaction: ethers.TransactionRequest,
) {
  const keyring = keyrings[personalWallet.keyringIdentifier];
  if (!keyring) {
    throw new Error(
      `cannot find keyring with identifier=${personalWallet.keyringIdentifier}`,
    );
  }
  if (personalWallet.type === IWalletType.SeedPhrase) {
    const wallet = await createEvmWalletFromSeed(
      keyring.value,
      personalWallet.derivationPath,
    );
    return wallet.signTransaction(transaction);
  } else if (personalWallet.type === IWalletType.PrivateKey) {
    const wallet = new Wallet(keyring.value);
    return wallet.signTransaction(transaction);
  }
  throw new Error(`Invalid wallet type=${personalWallet.type}`);
}
