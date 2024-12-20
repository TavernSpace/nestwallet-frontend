import NestLogo from '@nestwallet/app/assets/images/logos/nest-logo-light.svg';
import Image from 'next/image';
import { Root } from './root';

export function Header() {
  return (
    <Root>
      <div className='relative z-50 flex w-full flex-row justify-center py-6'>
        <div className='flex w-full flex-row items-center justify-between'>
          <div className='flex flex-row items-center space-x-1'>
            <div className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-full p-1.5'>
              <Image
                className='w-auto rounded-full'
                src={NestLogo}
                alt='Nest Logo'
                width={48}
                height={48}
              />
            </div>
            <div className='text-text-primary text-xl font-medium'>
              Nest Wallet
            </div>
          </div>
        </div>
      </div>
    </Root>
  );
}
