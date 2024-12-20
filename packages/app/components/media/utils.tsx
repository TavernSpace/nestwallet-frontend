import _ from 'lodash';

export enum MediaType {
  audio = 'audio',
  image = 'image',
  video = 'video',
}

export function isFile(value: any): boolean {
  return value instanceof File;
}

export function isIFile(value: any): boolean {
  return _.isString(value.id);
}
