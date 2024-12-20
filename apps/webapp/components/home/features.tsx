import { faCircleCheck } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Feature1Image from '@nestwallet/app/assets/images/home/feature1.png';
import Feature2Image from '@nestwallet/app/assets/images/home/feature2.png';
import Feature3Image from '@nestwallet/app/assets/images/home/feature3.png';
import Feature4Image from '@nestwallet/app/assets/images/home/feature4.png';
import SafeLogo from '@nestwallet/app/assets/images/logos/safe-logo-green.png';
import { colors } from '@nestwallet/app/design/constants';
import Image from 'next/image';

export function FeaturesSection() {
  return (
    <div className='py-8 sm:py-16 lg:py-24'>
      <div className='relative mx-auto max-w-7xl'>
        {/* Value prop 1 */}
        <div>
          <div className='flex flex-col gap-8 px-8 lg:flex-row lg:items-center lg:gap-16'>
            <div className='flex flex-1 justify-center lg:max-w-none lg:justify-center'>
              <Image
                className='w-full'
                src={Feature1Image}
                alt='feature1'
                style={{
                  objectFit: 'contain',
                  maxWidth: 600,
                  maxHeight: 600,
                }}
              />
            </div>

            <div className='order-first flex-1 lg:order-last'>
              <div className='flex justify-center lg:justify-start'>
                <ValuePropContent
                  highlight='On-Chain Trading'
                  title='All the tools you need to trade on-chain'
                  subtitle='Built by degens, for degens'
                  bulletPoint1='Hot trading window integrated with DexScreener & Birdeye'
                  bulletPoint2='View the P&L on all your token positions'
                  bulletPoint3={
                    <div className='flex items-center space-x-2'>
                      <div className='break-word'>
                        Limit orders for any Dex/Token
                      </div>
                      <div className='bg-primary flex-none rounded-full px-2 py-2 text-xs font-bold text-slate-900'>
                        Coming Soon
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Value prop 2 */}
        <div className='mt-12 pt-0 lg:pt-16'>
          <div className='flex flex-col gap-8 px-8 lg:flex-row lg:items-center lg:gap-16'>
            <div className='flex flex-1 justify-center lg:justify-end'>
              <ValuePropContent
                highlight='Security Prioritized'
                title='Maximum security to protect your assets'
                subtitle='Best in class security features integrated at every step'
                bulletPoint1='Built-in simulation on all messages and transactions'
                bulletPoint2={
                  <div className='flex items-center space-x-1'>
                    <div>{`In-app support for Safe{Wallet}`}</div>
                    <Image src={SafeLogo} alt='' width={20} height={20} />
                  </div>
                }
                bulletPoint3='Passkey and biometric signing on mobile'
              />
            </div>

            <div className='flex-1'>
              <div className='flex flex-1 justify-center lg:max-w-none lg:justify-center'>
                <Image
                  src={Feature2Image}
                  alt='feature2'
                  style={{
                    objectFit: 'contain',
                    maxHeight: 600,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Value prop 3 */}
        <div className='mt-12 pt-0 lg:pt-16'>
          <div className='flex flex-col gap-16 px-8 lg:flex-row lg:items-center lg:gap-16'>
            <div className='flex flex-1 justify-center lg:max-w-none lg:justify-center'>
              <Image
                src={Feature3Image}
                alt='feature3'
                style={{
                  objectFit: 'contain',
                  maxHeight: 550,
                }}
              />
            </div>

            <div className='order-first flex-1 lg:order-last'>
              <div className='flex justify-center lg:justify-start'>
                <ValuePropContent
                  highlight='Mobile Trading'
                  title='Effortlessly trade on mobile'
                  subtitle='All your wallets synced across mobile & extension'
                  bulletPoint1={
                    <div className='flex items-center space-x-2'>
                      <div className='break-word'>
                        Robinhood like UI for on-chain trading
                      </div>
                      <div className='bg-primary flex-none rounded-full px-2 py-2 text-xs font-bold text-slate-900'>
                        Coming Soon
                      </div>
                    </div>
                  }
                  bulletPoint2='Smooth wallet management system'
                  bulletPoint3='See your tokens and NFTs positions at a glance'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Value prop 4 */}
        <div className='mt-12 pt-0 lg:pt-16'>
          <div className='flex flex-col gap-8 px-8 lg:flex-row lg:items-center lg:gap-16'>
            <div className='flex flex-1 justify-center lg:justify-end'>
              <ValuePropContent
                highlight='Questing Campaign'
                title='Complete quests, gain XP and earn rewards'
                subtitle='Mint your free Nest NFT and join a community of early adopters and supporters'
                bulletPoint1='Evolve your Nest NFT on our journey towards decentralization'
                bulletPoint2='Discover Otto - a badge of dedication to the community'
                bulletPoint3={
                  <div>
                    We are just getting started! You are so{' '}
                    <span className='text-primary font-bold'>early</span> degen
                  </div>
                }
              />
            </div>

            <div className='flex-1'>
              <div className='flex max-w-[500px] justify-center lg:max-w-none lg:justify-start'>
                <Image
                  src={Feature4Image}
                  alt='feature3'
                  style={{
                    objectFit: 'contain',
                    maxWidth: 450,
                    maxHeight: 600,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValuePropContent(props: {
  highlight: string;
  title: string;
  subtitle: string;
  bulletPoint1: React.ReactNode;
  bulletPoint2: React.ReactNode;
  bulletPoint3: React.ReactNode;
}) {
  const {
    highlight,
    title,
    subtitle,
    bulletPoint1,
    bulletPoint2,
    bulletPoint3,
  } = props;
  return (
    <div className='max-w-lg lg:max-w-lg'>
      <div className='text-primary text-sm font-medium'>{highlight}</div>
      <div className='text-text-primary mt-4 text-3xl font-bold leading-snug sm:text-4xl'>
        {title}
      </div>
      <p className='text-text-secondary mt-2 text-base sm:text-lg'>
        {subtitle}
      </p>
      <ul className='mt-8 list-disc space-y-6 text-base text-slate-500'>
        <li className='flex flex-row items-center space-x-2'>
          <div className='text-primary'>
            <FontAwesomeIcon icon={faCircleCheck} color={colors.primary} />
          </div>
          <div className='text-text-primary text-sm sm:text-base'>
            {bulletPoint1}
          </div>
        </li>
        <li className='flex flex-row items-center space-x-2'>
          <div className='text-primary'>
            <FontAwesomeIcon icon={faCircleCheck} color={colors.primary} />
          </div>
          <div className='text-text-primary text-sm sm:text-base'>
            {bulletPoint2}
          </div>
        </li>
        <li className='flex flex-row items-center space-x-2'>
          <div className='text-primary'>
            <FontAwesomeIcon icon={faCircleCheck} color={colors.primary} />
          </div>
          <div className='text-text-primary text-sm sm:text-base'>
            {bulletPoint3}
          </div>
        </li>
      </ul>
    </div>
  );
}
