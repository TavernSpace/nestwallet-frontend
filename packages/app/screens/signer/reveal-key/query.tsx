import bs58 from 'bs58';
import { useCallback } from 'react';
import { useLoadFunction } from '../../../common/hooks/loading';
import { ISignerWallet, Loadable } from '../../../common/types';
import { makeLoadable, onLoadable } from '../../../common/utils/query';
import { onBlockchain } from '../../../features/chain';
import {
  createEvmWalletFromSeed,
  createSvmKeypairFromSeed,
  createTvmKeypairFromSeed,
  defaultSvmParentPath,
  defaultTvmParentPath,
} from '../../../features/wallet/seedphrase';
import { IWalletType } from '../../../graphql/client/generated/graphql';
import { RevealKeyScreen } from './screen';
import { SecretType } from './types';

interface RevealKeyQueryProps {
  signer: ISignerWallet;
  data: string;
  secretType: SecretType;
  onBack: VoidFunction;
}

export function RevealKeyWithQuery(props: RevealKeyQueryProps) {
  const { signer, data, secretType, onBack } = props;

  const getPrivateKey = useCallback(
    async () =>
      onBlockchain(signer.blockchain)(
        async () => {
          const wallet = await createEvmWalletFromSeed(
            data,
            signer.derivationPath ?? undefined,
          );
          return wallet.privateKey;
        },
        async () => {
          const derivationPath =
            signer.derivationPath ?? `${defaultSvmParentPath}/0'/0'`;
          const keypair = await createSvmKeypairFromSeed(data, derivationPath);
          return bs58.encode(keypair.secretKey);
        },
        async () => {
          const derivationPath =
            signer.derivationPath ?? `${defaultTvmParentPath}/0'`;
          const keypair = await createTvmKeypairFromSeed(data, derivationPath);
          return Buffer.from(keypair.secretKey).toString('hex');
        },
      ),
    [signer, data],
  );

  const { data: rawPrivateKey } = useLoadFunction(getPrivateKey);

  const privateKey: Loadable<string | null> =
    signer.type === IWalletType.SeedPhrase && secretType === 'pk'
      ? rawPrivateKey
      : makeLoadable(null);

  return onLoadable(privateKey)(
    () => null,
    // TODO: handle error
    () => null,
    (privateKey) => (
      <RevealKeyScreen
        signer={signer}
        data={
          privateKey
            ? privateKey.startsWith('0x')
              ? privateKey.slice(2)
              : privateKey
            : data
        }
        secretType={secretType}
        onBack={onBack}
      />
    ),
  );
}
