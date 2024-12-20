import _ from 'lodash';
import {
  IEdge,
  InputMaybe,
  IUpdateUserProfileInput,
  IUpsertContactInput,
  IUpsertWalletInput
} from './client/generated/graphql';

export function convertToEdge<T extends IEdge>(
  item?: InputMaybe<T>,
): IEdge | undefined {
  return item ? { id: item.id } : undefined;
}

export function convertToEdges<T extends IEdge>(array: Array<T>): Array<IEdge> {
  return _.map(array, (item) => {
    return { id: item.id };
  });
}

export function sanitizeUpdateUserProfileInput(
  input: IUpdateUserProfileInput,
): IUpdateUserProfileInput {
  const newInput = _.clone(input);
  newInput.profilePicture = convertToEdge(input.profilePicture);
  newInput.profilePictureUpload = input.profilePictureUpload;
  return newInput;
}

export function sanitizeUpsertWalletInput(
  input: IUpsertWalletInput,
): IUpsertWalletInput {
  const newInput = _.clone(input);
  newInput.profilePicture = convertToEdge(input.profilePicture);
  newInput.profilePictureUpload = input.profilePictureUpload;
  return newInput;
}

export function sanitizeUpsertContactMutation(
  input: IUpsertContactInput,
): IUpsertContactInput {
  const newInput = _.clone(input);
  newInput.profilePicture = convertToEdge(input.profilePicture);
  newInput.profilePictureUpload = input.profilePictureUpload;
  return newInput;
}
