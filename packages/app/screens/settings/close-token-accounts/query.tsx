import {
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useQueryRefetcher } from '../../../common/hooks/query';
import { loadDataFromQuery } from '../../../common/utils/query';
import { useCreateAndExecuteSvmTransaction } from '../../../features/svm/transaction/execute';
import { SmartSolanaRpcClient } from '../../../features/svm/transaction/smart-client';
import { deriveTokenAccountAddress } from '../../../features/svm/utils';
import { IProtectedWalletClient } from '../../../features/wallet/service/interface';
import {
  IEmptyTokenAccountType,
  ITransactionMetadataInput,
  ITransactionMetaType,
  IWallet,
  useEmptyTokenAccountsQuery,
} from '../../../graphql/client/generated/graphql';
import { graphqlType } from '../../../graphql/types';
import { CloseEmptyTokenAccountsScreen } from './screen';

export interface EmptySVMTokenMetadata {
  mintAddress: string;
  tokenAccountAddress: string;
  name: string;
  symbol: string;
  imageUrl: string;
  type: IEmptyTokenAccountType;
}

interface CloseEmptyTokenAccountsQueryProps {
  wallet: IWallet;
  client: IProtectedWalletClient;
  onCompleted: VoidFunction;
}

export function CloseEmptyTokenAccountsQuery(
  props: CloseEmptyTokenAccountsQueryProps,
) {
  const { wallet, client, onCompleted } = props;

  const { signAndSendTransaction } = useCreateAndExecuteSvmTransaction(
    client,
    wallet,
  );

  const emptyTokenAccountsQuery = useQueryRefetcher(
    [graphqlType.EmptyTokenAccounts],
    useEmptyTokenAccountsQuery({
      walletId: wallet.id,
    }),
  );
  const emptyTokenAccounts = loadDataFromQuery(
    emptyTokenAccountsQuery,
    (data) =>
      data.emptyTokenAccounts.map((account) => {
        const tokenAddress = deriveTokenAccountAddress(
          wallet.address,
          account.mintAddress,
        );
        return {
          mintAddress: account.mintAddress,
          tokenAccountAddress: tokenAddress.toBase58(),
          name: account.name,
          symbol: account.symbol,
          imageUrl: account.imageUrl,
          type: account.type,
        };
      }),
  );

  const handleExecute = async (accounts: EmptySVMTokenMetadata[]) => {
    const tx = new Transaction();
    const rpcClient = new SmartSolanaRpcClient();
    const userPublicKey = new PublicKey(wallet.address);
    const metadata: ITransactionMetadataInput[] = [];
    for (const tokenAccount of accounts) {
      const tokenAccountPublicKey = new PublicKey(
        tokenAccount.tokenAccountAddress,
      );
      tx.add(
        createCloseAccountInstruction(
          tokenAccountPublicKey,
          userPublicKey,
          userPublicKey,
          [],
          TOKEN_PROGRAM_ID,
        ),
      );
      const data: ITransactionMetadataInput =
        tokenAccount.type === IEmptyTokenAccountType.Token
          ? {
              type: ITransactionMetaType.TokenBurn,
              data: {
                amount: '0',
                tokenAddress: tokenAccount.mintAddress,
                tokenMetadata: {
                  address: tokenAccount.mintAddress,
                  decimals: 6,
                  id: tokenAccount.mintAddress,
                  imageUrl: tokenAccount.imageUrl,
                  name: tokenAccount.name,
                  symbol: tokenAccount.symbol,
                  price: '0',
                  isNativeToken: false,
                },
              },
            }
          : {
              type: ITransactionMetaType.NftBurn,
              data: {
                amount: '0',
                nftAddress: tokenAccount.mintAddress,
                imageUrl: tokenAccount.imageUrl,
                name: tokenAccount.name,
              },
            };
      metadata.push(data);
    }
    const smartTx = await rpcClient.buildSmartTransaction(
      tx.instructions,
      userPublicKey,
      undefined,
      undefined,
      300_000,
      95,
    );
    const proposal = await signAndSendTransaction({ data: smartTx, metadata });
    return proposal.svmKey!.txHash!;
  };

  return (
    <CloseEmptyTokenAccountsScreen
      wallet={wallet}
      onCompleted={onCompleted}
      onExecute={handleExecute}
      emptyTokenAccounts={emptyTokenAccounts}
    />
  );
}
