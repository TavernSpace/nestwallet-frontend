import {
  ReactNativeFile,
  extractFiles,
  isExtractableFile,
} from 'extract-files';
import { GraphqlErrors } from '../../features/errors/graphql/types';
import { AuthorizationError } from '../../features/errors/http/types';
import { useNestWallet } from '../../provider/nestwallet';
import { NestWalletClient } from '../api/nestwallet/client';

export { ReactNativeFile };

function generateGraphQLBody<TVariables>(
  query: string,
  variables?: TVariables,
) {
  if (!variables) {
    return JSON.stringify({
      query,
      variables,
    });
  }

  const data = extractFiles(variables, 'variables', isExtractableFile);
  if (data.files.size > 0) {
    const formData = new FormData();
    const operation = {
      variables: data.clone,
      query: query,
    };
    formData.append('operations', JSON.stringify(operation));
    const map: Record<string, string[]> = {};
    Array.from(data.files).forEach((field, index) => {
      map[index.toString()] = field[1];
    });
    formData.append('map', JSON.stringify(map));
    Array.from(data.files).forEach((field, index) => {
      formData.append(index.toString(), field[0] as Blob);
    });
    return formData;
  } else {
    return JSON.stringify({
      query,
      variables,
    });
  }
}

export const fetchGraphql = async <TData, TVariables>(
  apiClient: NestWalletClient,
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
): Promise<TData> => {
  const body = generateGraphQLBody(query, variables);
  const headers =
    body instanceof FormData
      ? { ...options }
      : { ...options, 'Content-Type': 'application/json' };
  const res = await apiClient.fetchGraphql({
    method: 'POST',
    headers,
    body,
  });

  const json = await res.json();
  if (json.errors) {
    throw new GraphqlErrors({ graphQLErrors: json.errors || [] });
  } else if (json.code?.name === 'unauthorized') {
    throw new AuthorizationError(json.message || 'Unauthorized');
  }
  return json.data;
};

export const fetchCustomGraphql = async <TData, TVariables>(
  url: string,
  query: string,
  variables?: TVariables,
  options?: RequestInit['headers'],
): Promise<TData> => {
  const body = generateGraphQLBody(query, variables);
  const headers =
    body instanceof FormData
      ? { ...options }
      : { ...options, 'Content-Type': 'application/json' };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });
  return res.json();
};

export const useFetchData = <TData, TVariables>(
  query: string,
  options?: RequestInit['headers'],
): ((variables?: TVariables) => Promise<TData>) => {
  const { apiClient } = useNestWallet();
  return async (variables?: TVariables) =>
    fetchGraphql(apiClient, query, variables, options);
};
