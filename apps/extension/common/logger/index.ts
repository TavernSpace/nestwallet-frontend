import { IS_PRODUCTION } from '../constants';

let _LOG_LEVEL: LogLevel;
export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export function getLogger(prefix: string, mod: string) {
  if (_LOG_LEVEL === undefined) {
    _LOG_LEVEL = LogLevel.Debug;
  }
  return (() => {
    return {
      debug: (str: string, ...args: any) =>
        debug(`nestwallet:${prefix}::${mod}: ${str}`, ...args),
      error: (str: string, ...args: any) =>
        error(`nestwallet:${prefix}::${mod}: ${str}`, ...args),
      _log,
    };
  })();
}

function debug(str: any, ...args: any) {
  if (_LOG_LEVEL <= LogLevel.Debug) {
    log(str, ...args);
  }
}

function error(str: any, ...args: any) {
  if (_LOG_LEVEL <= LogLevel.Error) {
    log(`ERROR: ${str}`, ...args);
  }
}

function log(str: any, ...args: any) {
  _log(str, ...args);
}

function _log(str: any, ...args: any) {
  if (!IS_PRODUCTION) console.log(str, ...args);
}
