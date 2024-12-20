import { HTTPError } from '../../features/errors/http/types';
import { HttpStatusCode } from './nestwallet/constant';

export async function handleJSONResponse(resp: Response) {
  if (resp.status >= HttpStatusCode.Ok && resp.status < 300) {
    return resp.json();
  }
  const text = await resp.text();
  throw new HTTPError(resp.status, text);
}

export async function handleWrappedJSONResponse(resp: Response) {
  if (resp.status >= 200 && resp.status < 300) {
    const data = await resp.json();
    const resultKeys = Object.keys(data.result);
    if (resultKeys.length === 0) {
      throw new Error('No result keys found');
    }
    const resultKey = resultKeys[0];
    return data.result[resultKey!];
  }
  const text = await resp.text();
  throw new HTTPError(resp.status, text);
}

// TODO: move this to common/utils/functions
export async function delay(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function minTime<T>(promise: Promise<T>, ms: number): Promise<T> {
  const [result] = await Promise.all([promise, delay(ms)]);
  return result;
}
