import transformTypedDataPlugin from '@trezor/connect-plugin-ethereum';
import { TypedDataEncoder, ethers } from 'ethers';
import _ from 'lodash';
import { IPersonalWallet } from '../../common/types';
import { IWalletType } from '../../graphql/client/generated/graphql';
import { TypedData } from './types';

export async function sanitizeTransactionRequest(
  provider: ethers.JsonRpcApiProvider,
  transaction: ethers.TransactionRequest,
): Promise<ethers.PerformActionTransaction> {
  // turn transaction request into simple object
  const request = await provider._getTransactionRequest(transaction);
  // remove the from field from - ethers complains about
  // "unsigned transaction cannot define from"
  return {
    ...request,
    from: undefined,
  };
}

export function sanitizeTypedData(typedData: TypedData): TypedData {
  // ethers v6 auto infer primaryType by traversing the dag,
  // we need to delete any unused types
  try {
    const { domain, primaryType, types, message } = typedData;
    const sanitizeTypes = { ...types };
    if (primaryType) {
      // remove unused types
      const usedTypes = getUsedTypes(types, primaryType);
      for (const type in sanitizeTypes) {
        if (!usedTypes.includes(type)) {
          delete sanitizeTypes[type];
        }
      }
    }
    return TypedDataEncoder.getPayload(domain, sanitizeTypes, message);
  } catch (err) {
    throw new Error('Invalid typed data');
  }
}

export function getDomainAndMessageHash(typedData: TypedData) {
  const domain = typedData.domain as any;
  const primaryType = typedData.primaryType as any;
  const message = typedData.message;
  const types = typedData.types as any;
  const { domain_separator_hash, message_hash } = transformTypedDataPlugin(
    { domain, types, message, primaryType },
    true,
  );
  return { domainHash: domain_separator_hash, messageHash: message_hash };
}

function getUsedTypes(
  types: Record<string, ethers.TypedDataField[]>,
  primaryType: string,
  returnTypes: string[] = [],
): string[] {
  const foundTypes =
    types[primaryType]?.map((type) => type.type.split('[')[0]!) ?? [];
  const validTypes: string[] = _.uniq(
    foundTypes.filter((type) => types[type] && !returnTypes.includes(type)),
  );
  return [primaryType].concat(
    validTypes.flatMap((type) =>
      getUsedTypes(types, type, returnTypes.concat(primaryType)),
    ),
  );
}

export function validateCorrectDevice(
  personalWallet: IPersonalWallet,
  address: string,
) {
  const deviceName =
    personalWallet.type === IWalletType.Ledger ? 'Ledger' : 'Trezor';
  if (personalWallet.address !== address) {
    throw new Error(
      `Wallet ${address} does not belong to the connected ${deviceName}`,
    );
  }
}
