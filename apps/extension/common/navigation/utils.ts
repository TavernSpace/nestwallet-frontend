import {
  IApproveInput,
  IApproveMessageInput,
  IApproveTransactionInput,
} from '@nestwallet/app/common/types';
import { WindowType } from '@nestwallet/app/provider/nestwallet';

export enum QueryType {
  payload = 'payload',
  type = 'type',
}

export const POPUP_HTML = 'index.html';

export function encodePayload(payload: {}) {
  return encodeURIComponent(JSON.stringify(payload));
}

export function decodePayload<T>(payload: string): T {
  return JSON.parse(decodeURIComponent(payload));
}

export function buildQuery(props: {
  path: string;
  params: Record<string, string>;
}) {
  const searchParams = new URLSearchParams(props.params);
  return `${POPUP_HTML}?${searchParams.toString()}#/${props.path}`;
}

export function buildApprovalQuery(props: {
  path: string;
  payload: IApproveInput | IApproveTransactionInput | IApproveMessageInput;
}) {
  const params: Record<string, string> = {
    [QueryType.payload]: encodePayload(props.payload),
    [QueryType.type]: WindowType.window,
  };
  return buildQuery({ path: props.path, params });
}

export function buildIntroQuery() {
  const params = {
    [QueryType.payload]: '',
    [QueryType.type]: WindowType.tab,
  };
  return buildQuery({ path: 'intro', params });
}
