import { faTimes } from '@fortawesome/pro-solid-svg-icons';
import { IconButton } from '@nestwallet/app/components/button/icon-button';
import { colors } from '@nestwallet/app/design/constants';

interface PopupProps {
  isShowing: boolean;
  children: React.ReactNode;
  onClose?: VoidFunction;
}
//This component is basically the equivalent of the 'sheet' on our app
export function Popup(props: PopupProps) {
  const { isShowing, children, onClose } = props;

  return (
    <>
      {isShowing && (
        <>
          <div className='bg-card fixed inset-0 flex h-full w-full flex-row overflow-hidden opacity-40 backdrop-blur-lg' />
          <div className='fixed inset-0 flex h-full w-full items-center justify-center overflow-hidden'>
            <div className='bg-background relative z-50 flex min-h-[100px] min-w-[200px] flex-col rounded-2xl'>
              <div className='flex w-full flex-col items-end justify-end'>
                <IconButton
                  className='pr-2 pt-2'
                  icon={faTimes}
                  color={colors.textPrimary}
                  size={20}
                  onPress={onClose}
                />
              </div>
              {children}
            </div>
          </div>
        </>
      )}
    </>
  );
}
