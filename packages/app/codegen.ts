import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://127.0.0.1:8080/local/v1/client/graphql',
  documents: 'graphql/client/**/*.graphql',
  generates: {
    'graphql/client/generated/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query',
      ],
      config: {
        fetcher: {
          func: '../../../common/hooks/graphql#useFetchData',
          isReactHook: true,
        },
        declarationKind: 'interface',
        dedupeFragments: true,
        reactQueryVersion: 5,
        skipTypename: true,
        typesPrefix: 'I',
        scalars: {
          Int64: 'number',
          JSON: 'any',
          // JSON: '{ [key: string]: any }',
          Timestamp: 'string',
          UUID: 'string',
          Upload: 'any',
          Void: 'never',
        },
      },
    },
  },
};

export default config;
