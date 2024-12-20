import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '../provider/application';

export function useDeviceIdQuery() {
  const { walletService } = useAppContext();
  return useQuery({
    queryKey: ['queryDeviceId'],
    queryFn: () => walletService.getDeviceId().then((id) => id ?? null),
  });
}
