import { GraphQLError } from 'graphql';
import { AppError } from '../types';

export interface ValidationError {
  type: 'validationError';
  path?: string;
  code: {
    name: string;
    domain: string;
  };
}

export class GraphqlErrors extends AppError {
  graphQLErrors: ReadonlyArray<GraphQLError>;

  constructor(options: { graphQLErrors: Array<GraphQLError> }) {
    super('');
    this.graphQLErrors = options.graphQLErrors;
  }
}
