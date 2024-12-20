import Color from 'color';
import { debounce } from 'lodash';
import { IntRange, Tuple } from '../types';

export const empty = () => undefined;

export const id = <T>(x: T): T => x;

export const tuple = <T extends any[]>(...x: T) => x;

export const cond = <T>(c: boolean, f: () => T) => (c ? f() : undefined);

// TODO: this type is slightly wrong when using literal keys
export const recordify = <T, K extends keyof any>(
  arr: T[],
  keyExtractor: (item: T, index: number) => K,
): Record<K, T> =>
  arr.reduce<Record<K, T>>((acc, cur, index) => {
    acc[keyExtractor(cur, index)] = cur;
    return acc;
  }, {} as Record<K, T>);

export const recordFrom = <T, K extends keyof any, V>(
  arr: T[],
  keyExtractor: (item: T, index: number) => K,
  itemExtractor: (item: T, index: number) => V,
): Record<K, V> =>
  arr.reduce<Record<K, V>>((acc, cur, index) => {
    acc[keyExtractor(cur, index)] = itemExtractor(cur, index);
    return acc;
  }, {} as Record<K, V>);

export const collect = <T, K extends keyof any>(
  arr: T[],
  keyExtractor: (item: T, index: number) => K,
): Record<K, T[]> =>
  arr.reduce<Record<K, T[]>>((acc, cur, index) => {
    const key = keyExtractor(cur, index);
    if (key in acc) {
      acc[keyExtractor(cur, index)].push(cur);
    } else {
      acc[keyExtractor(cur, index)] = [cur];
    }
    return acc;
  }, {} as Record<K, T[]>);

export const mapObject = <T, V>(
  record: Record<string, T>,
  map: (value: T) => V,
): Record<string, V> =>
  recordFrom(
    Object.keys(record).map((key) => tuple(key, map(record[key]!))),
    (item) => item[0],
    (item) => item[1],
  );

export const omit = <T extends Record<any, any>, K extends keyof T>(
  record: T,
  ...keys: K[]
): Omit<T, K> => {
  const val = { ...record };
  keys.forEach((key) => delete val[key]);
  return val;
};

export const discard = <T extends any[]>(...args: T): void => undefined;

export const awaitAndDiscard = async <T>(arg: Promise<T>) => discard(await arg);

export const withDiscardedAsyncResult =
  <
    TArgs extends any[],
    TReturn extends Promise<any>,
    TFunc extends (...args: TArgs) => TReturn,
  >(
    f: TFunc,
  ) =>
  (...args: TArgs) =>
    awaitAndDiscard(f(...args));

export const isJSONString = (jsonString: string) => {
  try {
    const o = JSON.parse(jsonString);

    // Handle non-exception-throwing cases:
    // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
    // but... JSON.parse(null) returns null, and typeof null === "object",
    // so we must check for that, too. Thankfully, null is falsey, so this suffices:
    if (o && typeof o === 'object') {
      return true;
    }
  } catch (e) {
    // nothing
  }

  return false;
};

// https://github.com/lodash/lodash/issues/4815
export const asyncDebounce = <F extends (...args: any[]) => Promise<any>>(
  func: F,
  wait?: number,
) => {
  const resolveSet = new Set<(p: any) => void>();
  const rejectSet = new Set<(p: any) => void>();

  const debounced = debounce((args: Parameters<F>) => {
    func(...args)
      .then((...res) => {
        resolveSet.forEach((resolve) => resolve(...res));
        resolveSet.clear();
      })
      .catch((...res) => {
        rejectSet.forEach((reject) => reject(...res));
        rejectSet.clear();
      });
  }, wait);

  return (...args: Parameters<F>): ReturnType<F> =>
    new Promise((resolve, reject) => {
      resolveSet.add(resolve);
      rejectSet.add(reject);
      debounced(args);
    }) as ReturnType<F>;
};

export const withHttps = (url: string) =>
  url.replace(/^(?:(.*:)?\/\/)?(.*)/i, (match, schema, nonSchemaUrl) =>
    schema ? match : `https://${nonSchemaUrl}`,
  );

export const opacity = (hex: string, amount: IntRange<0, 101>) =>
  hex +
  `0${Math.round((255 * amount) / 100).toString(16)}`.slice(-2).toUpperCase();

const composite = (fgNum: number, bgNum: number, opacity: number) =>
  Math.floor(opacity * fgNum + (1 - opacity) * bgNum);

export const opaque = (
  fgHex: string,
  bgHex: string,
  amount: IntRange<0, 101>,
) => {
  const [r1, g1, b1] = Color(fgHex).rgb().array() as Tuple<number, 3>;
  const [r2, g2, b2] = Color(bgHex).rgb().array() as Tuple<number, 3>;
  const opacity = amount / 100;
  return Color.rgb(
    composite(r1, r2, opacity),
    composite(g1, g2, opacity),
    composite(b1, b2, opacity),
  )
    .hex()
    .toUpperCase();
};

export const seq = async <T>(arr: (() => Promise<T>)[]): Promise<T[]> => {
  const res: T[] = [];
  for (const f of arr) {
    res.push(await f());
  }
  return res;
};

export const firstOf = <T>(...arr: [boolean, () => T][]) =>
  arr.find((item) => item[0])?.[1]();

export function base64url(val: string) {
  return val.replaceAll('/', '_').replaceAll('+', '-').replaceAll('=', '');
}

export async function retry<T>(
  f: () => Promise<Awaited<T>>,
  stopCondition?: (err: unknown) => boolean,
  additionalAttempts = 2,
): Promise<Awaited<T>> {
  try {
    const result = await f();
    return result;
  } catch (err) {
    if (stopCondition?.(err)) {
      throw err;
    } else if (additionalAttempts > 0) {
      await delay(500);
      return retry(f, stopCondition, additionalAttempts - 1);
    } else {
      throw err;
    }
  }
}

function delay(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}
