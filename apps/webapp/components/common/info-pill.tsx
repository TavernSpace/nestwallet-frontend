import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import { colors } from '@nestwallet/app/design/constants';

interface InfoPillProps {
  icon: IconProp;
  text: string;
  iconRotation?: number; //Used for spinning animation
}

export function InfoPill(props: InfoPillProps) {
  const { icon, text, iconRotation } = props;

  return (
    <div className='bg-primary/10 flex w-fit flex-row items-center rounded-full px-4 py-1.5'>
      <div className='flex flex-row items-center space-x-2'>
        <div
          className='transition-all duration-500'
          style={{
            transform: `rotate(${iconRotation}deg)`,
          }}
        >
          <FontAwesomeIcon icon={icon} color={colors.primary} />
        </div>

        <div className='text-primary text-center text-sm font-medium'>
          {text}
        </div>
      </div>
    </div>
  );
}
