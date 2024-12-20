import { useEffect, useState } from 'react';

export function useLoadImage(uri: string | undefined, prefix: string) {
  const [error, setError] = useState(false);
  const [image, setImage] = useState<string>(
    uri && !uri.startsWith(prefix) ? uri : '',
  );

  const fetchImage = async () => {
    if (!uri) {
      setError(true);
    } else if (uri && uri.startsWith(prefix)) {
      try {
        const result = await fetch(uri);
        if (result.ok) {
          setImage(uri);
          setError(false);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      }
    }
  };

  useEffect(() => {
    fetchImage();
  }, [uri, prefix]);

  return [image, error] as const;
}
