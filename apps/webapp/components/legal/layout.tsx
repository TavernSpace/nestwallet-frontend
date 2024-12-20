import cn from 'classnames';
import Link from 'next/link';

export function LegalLayout(props: { children: React.ReactElement }) {
  return (
    <div className='flex w-full justify-center'>
      <div className='flex w-full max-w-7xl flex-wrap px-10'>
        <div className='w-full md:w-2/3'>{props.children}</div>
        <div className='w-full md:w-1/3'>
          <TableOfContent />
        </div>
      </div>
    </div>
  );
}

function TableOfContent() {
  return (
    <div className={cn('mx-auto max-w-3xl py-16 md:border-0')}>
      <div className='space-y-4 border-gray-300 md:border-l md:px-8'>
        <div className='text-xs font-bold uppercase tracking-widest'>Legal</div>
        <ul className='space-y-4'>
          <li>
            <Link className='block' href='/legal/terms'>
              {' '}
              Terms of Service{' '}
            </Link>
          </li>
          <li>
            <Link className='block' href='/legal/privacy'>
              {' '}
              Privacy Policy{' '}
            </Link>
          </li>
          <li>
            <Link className='block' href='/legal/contact'>
              {' '}
              Contact Us{' '}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
