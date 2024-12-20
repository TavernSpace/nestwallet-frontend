export function Root(props: { children: React.ReactNode }) {
  const { children } = props;

  return <div className='w-full max-w-7xl px-8 xl:px-0'>{children}</div>;
}
