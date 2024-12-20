import cn from 'classnames';

export function ContactScreen() {
  const smClasses = 'py-16 mx-auto';
  const mdClasses = 'md:ml-auto md:mr-8';
  return (
    <div className={cn('max-w-3xl', smClasses, mdClasses)}>
      <div className='text-3xl font-bold leading-9'>Contact Us</div>

      <div className='mt-6 h-screen leading-7'>
        <div className='italic'>
          We ❤️ hearing from our users! Please tell us about any bugs, issues,
          or how we can better support you.
        </div>
        <div className='mt-12'>
          Email <span className='font-bold'>contact[at]nestwallet[dot]xyz</span>{' '}
          and the founders will personally get back to you within 24 hours.
        </div>
      </div>
    </div>
  );
}
