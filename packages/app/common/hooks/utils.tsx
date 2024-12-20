import { useEffect, useRef, useState } from 'react';
import { DefinedType } from '../types';
import { tuple } from '../utils/functions';

export function useEffectOnChange<T extends DefinedType>(
  value: T,
  effect: (arg: T) => void,
) {
  const oldValue = useRef<T>();

  useEffect(() => {
    if (oldValue.current === undefined) {
      oldValue.current = value;
    } else if (oldValue.current !== value) {
      oldValue.current = value;
      effect(value);
    }
  }, [value]);
}

export function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState(value);
  const [previous, setPrevious] = useState<T | null>(null);

  if (value !== current) {
    setPrevious(current);
    setCurrent(value);
  }

  return previous;
}

export function useInterval(
  f: VoidFunction,
  duration: number,
  stopCondition?: boolean,
) {
  useEffect(() => {
    if (stopCondition) {
      return;
    }
    const interval = setInterval(f, duration);
    return () => {
      clearInterval(interval);
    };
  }, [f, stopCondition]);
}

export function useStateAndRef<T>(initial: T) {
  const [value, setValue] = useState(initial);
  const valueRef = useRef(value);
  valueRef.current = value;
  return tuple(value, setValue, valueRef);
}
