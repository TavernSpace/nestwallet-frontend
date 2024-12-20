import { faCheck, faTimes } from '@fortawesome/pro-solid-svg-icons';
import coinbaseLogo from '@nestwallet/app/assets/images/home/comparison/coinbase.png';
import metamaskLogo from '@nestwallet/app/assets/images/home/comparison/metamask.png';
import nestLogo from '@nestwallet/app/assets/images/home/comparison/nestwallet.png';
import rabbyLogo from '@nestwallet/app/assets/images/home/comparison/rabby.png';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { colors } from '@nestwallet/app/design/constants';
import Image from 'next/image';

const data: {
  label: string;
  values: ('yes' | 'no' | 'partial')[];
}[] = [
  { label: 'EOA Support', values: ['yes', 'yes', 'yes', 'yes'] },
  {
    label: 'Ledger & Trezor Support',
    values: ['yes', 'yes', 'yes', 'partial'],
  },
  {
    label: 'Optimized Safe Support (smart contract wallet)',
    values: ['yes', 'no', 'partial', 'no'],
  },
  { label: 'One account across devices', values: ['yes', 'no', 'no', 'no'] },
  { label: 'Extension Notifications', values: ['yes', 'no', 'no', 'no'] },
  { label: 'Mobile Passkey', values: ['yes', 'no', 'no', 'no'] },
];

export function Comparison() {
  return (
    <div className='bg-background py-8 sm:py-16 lg:py-24 '>
      <div className='mx-auto max-w-7xl px-8 lg:px-8'>
        <div className='flex justify-center'>
          <div className='max-w-xl text-center'>
            <h2 className='text-primary text-center text-lg font-bold'>
              Comparison
            </h2>
            <p className='text-text-primary mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>
              Not just another wallet. See how we stand out from the crowd
            </p>
          </div>
        </div>
        <div className='mt-16 divide-y divide-slate-800'>
          <div className='flex flex-row items-center space-x-2 py-6 sm:items-end'>
            <div className='text-text-primary flex-1 text-center text-sm font-bold sm:text-lg'>
              Item
            </div>
            <div className='text-primary flex flex-1 flex-col items-center text-center text-sm font-bold sm:text-lg'>
              <Image src={nestLogo} alt='' width={48} height={48} />
              <div className='hidden sm:block'>Nest Wallet</div>
            </div>
            <div className='text-text-primary flex flex-1 flex-col items-center text-center text-sm font-bold sm:text-lg'>
              <Image src={metamaskLogo} alt='' width={48} height={48} />
              <div className='hidden sm:block'>MetaMask</div>
            </div>
            <div className='text-text-primary flex flex-1 flex-col items-center text-center text-sm font-bold sm:text-lg'>
              <Image src={rabbyLogo} alt='' width={48} height={48} />
              <div className='hidden sm:block'>Rabby</div>
            </div>
            <div className='text-text-primary flex flex-1 flex-col items-center text-center text-sm font-bold sm:text-lg'>
              <Image src={coinbaseLogo} alt='' width={48} height={48} />
              <div className='hidden sm:block'>Coinbase Wallet</div>
            </div>
          </div>
          {data.map((row, index) => (
            <div key={index} className='flex flex-row items-center py-6'>
              <div className='text-text-primary flex-1 text-center text-sm sm:text-base'>
                {row.label}
              </div>
              {row.values.map((value, index) => (
                <TableCell type={value} key={index} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableCell(props: { type: 'yes' | 'no' | 'partial' }) {
  const { type } = props;
  return (
    <div className='text-primary flex flex-1 justify-center'>
      {type === 'yes' ? (
        <FontAwesomeIcon icon={faCheck} color={colors.primary} size={24} />
      ) : type === 'no' ? (
        <FontAwesomeIcon icon={faTimes} color={colors.failure} size={24} />
      ) : type === 'partial' ? (
        <div className='text-text-primary text-sm sm:text-base'>Partial</div>
      ) : null}
    </div>
  );
}
