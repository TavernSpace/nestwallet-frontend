import {
  faDiscord,
  faLinkedin,
  faTelegram,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { colors } from '@nestwallet/app/design/constants';

const footerNavigation = {
  main: [
    { name: 'Privacy Policy', to: '/legal/privacy' },
    { name: 'Terms of Service', to: '/legal/terms' },
    // {
    //   name: 'Blogs',
    //   to: 'https://mirror.xyz/0xb2b6Baa703fAFCD5ea93f092e30A50Ef70752452',
    // },
    {
      name: 'Docs',
      to: 'https://faq.nestwallet.xyz/',
    },
    { name: 'Contact us', to: '/legal/contact' },
  ],
};

export function Footer() {
  return (
    <footer className='bg-card border-t-card-highlight w-full border-t'>
      <div className='mx-auto max-w-md overflow-hidden px-6 pb-10 pt-8 sm:max-w-3xl lg:max-w-7xl lg:px-8'>
        <nav
          className='-mx-5 -my-2 flex flex-wrap justify-center'
          aria-label='Footer'
        >
          {footerNavigation.main.map((item) => (
            <div key={item.name} className='px-5 py-2'>
              <a
                className='text-text-secondary hover:text-text-primary text-base font-normal'
                href={item.to}
              >
                {item.name}
              </a>
            </div>
          ))}
        </nav>
        <div className='mt-8 flex justify-center space-x-6'>
          <div className='flex flex-col items-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
            <div className='flex justify-center space-x-6'>
              <a
                href='https://www.twitter.com/nestwalletxyz'
                target='_blank'
                rel='noreferrer'
              >
                <FontAwesomeIcon
                  color={colors.textSecondary}
                  icon={faTwitter}
                  size={24}
                />
              </a>
              <a
                href='https://discord.gg/ByqrRvcbWq'
                target='_blank'
                rel='noreferrer'
              >
                <FontAwesomeIcon
                  color={colors.textSecondary}
                  icon={faDiscord}
                  size={24}
                />
              </a>
              <a
                href='https://t.me/nest_wallet'
                target='_blank'
                rel='noreferrer'
              >
                <FontAwesomeIcon
                  color={colors.textSecondary}
                  icon={faTelegram}
                  size={24}
                />
              </a>
              <a
                href='https://www.linkedin.com/company/nestwallet/'
                target='_blank'
                rel='noreferrer'
              >
                <FontAwesomeIcon
                  color={colors.textSecondary}
                  icon={faLinkedin}
                  size={24}
                />
              </a>
            </div>
          </div>
        </div>
        <p className='text-text-secondary mt-8 text-center text-base'>
          &copy; 2024 Nest Technologies HK Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
