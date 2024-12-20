import { UseQueryOptions, useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { UINT256_MAX, nullAddress } from '../evm/constants';
import { getJSONRPCProvider } from '../evm/provider';

export const allowanceAbi = [
  {
    name: 'allowance',
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

export async function tokenApproval(input: {
  address: string;
  chainId: number;
  tokenAddress: string;
  approvalAddress: string;
}) {
  const { address, chainId, tokenAddress, approvalAddress } = input;

  if (tokenAddress === nullAddress) {
    return BigInt(UINT256_MAX);
  }

  const contract = new ethers.Contract(
    tokenAddress,
    allowanceAbi,
    getJSONRPCProvider(chainId),
  );
  const allowance: bigint = await contract.allowance!(address, approvalAddress);
  return allowance;
}

export function useTokenApprovalQuery(
  input: {
    address: string;
    chainId: number;
    tokenAddress: string;
    approvalAddress: string;
  },
  options?: Omit<UseQueryOptions<bigint, unknown>, 'queryKey'>,
) {
  return useQuery({
    queryKey: ['requiredApprovalQuery', { input }],
    queryFn: () => tokenApproval(input),
    ...options,
  });
}
