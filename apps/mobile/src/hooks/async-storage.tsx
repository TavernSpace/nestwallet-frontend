import { useAsyncStorage } from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function useAsyncStorageWithState(key: string, defaultValue?: string) {
  const { getItem, setItem } = useAsyncStorage(key);

  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [valueState, setValueState] = useState<string | null>();

  useEffect(() => {
    getItem()
      .then((item) => setValueState(item ?? defaultValue))
      .catch(() => setIsError(true))
      .finally(() => setIsLoading(false));
  }, []);

  const setValue = useCallback(
    (value: string) => {
      setItem(value);
      setValueState(value);
    },
    [setItem, setValueState],
  );

  return { isLoading, isError, value: valueState, setValue };
}
