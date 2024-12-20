import { faLinkedin, faTwitter } from '@fortawesome/free-brands-svg-icons';
import angelProfPic from '@nestwallet/app/assets/images/home/team/angel.png';
import austinProfPic from '@nestwallet/app/assets/images/home/team/austin.png';
import boProfPic from '@nestwallet/app/assets/images/home/team/bo.png';
import iamProfPic from '@nestwallet/app/assets/images/home/team/iam.jpg';
import andrewProfPic from '@nestwallet/app/assets/images/home/team/madlads.png';
import osamaProfPic from '@nestwallet/app/assets/images/home/team/one-punch-man.png';
import billProfPic from '@nestwallet/app/assets/images/home/team/penguin.png';
import stoneProfPic from '@nestwallet/app/assets/images/home/team/stone.png';
import { delay } from '@nestwallet/app/common/api/utils';
import { FontAwesomeIcon } from '@nestwallet/app/components/font-awesome-icon';
import Image from 'next/image';
import { useState } from 'react';
import { adjustWeb, useScreenSize } from './utils';

const people = [
  {
    name: 'billlou.eth',
    role: 'Co-Founder & Chief Degen',
    imageUrl: billProfPic,
    twitter: 'https://twitter.com/BillLou95',
    linkedIn: 'https://www.linkedin.com/in/bill-lou/',
  },
  {
    name: 'actype.eth',
    role: 'Head of Engineering',
    imageUrl: andrewProfPic,
  },
  {
    name: 'Austin',
    role: 'Software Engineer',
    imageUrl: austinProfPic,
  },
  {
    name: 'Osama',
    role: 'Head of Growth',
    imageUrl: osamaProfPic,
    twitter: 'https://twitter.com/0xsiris_dev',
    linkedIn: 'https://www.linkedin.com/in/omurshid/',
  },
  {
    name: 'Angel',
    role: 'Marketing',
    imageUrl: angelProfPic,
    linkedIn: 'https://www.linkedin.com/in/angel-wen/',
  },
  {
    name: 'Stone',
    role: 'Designer',
    imageUrl: stoneProfPic,
  },
  {
    name: 'Bo',
    role: 'Videographer',
    imageUrl: boProfPic,
  },
  {
    name: 'Iam',
    role: 'Growth Marketing Manager, Nigeria',
    imageUrl: iamProfPic,
    twitter: 'https://x.com/BossDR7',
    linkedIn: 'https://www.linkedin.com/in/iametefia/',
  },
];

export function Team() {
  return (
    <div className='z-50 py-8 sm:py-16 lg:py-24'>
      <div className='mx-auto max-w-xl px-8 lg:max-w-7xl lg:px-8'>
        <div className='flex justify-center'>
          <div className='flex flex-col items-center text-center'>
            <div className='bg-primary/10 w-fit rounded-full px-4 py-1.5'>
              <h2 className='text-primary text-center text-sm font-medium'>
                Our Team
              </h2>
            </div>
            <p className='text-text-primary mt-4 text-2xl font-medium'>
              We are a growing team of crypto natives & passionate builders.
            </p>
          </div>
        </div>

        <div className='mx-auto mt-16 flex flex-wrap justify-center gap-12 text-center md:gap-16 lg:gap-12'>
          {people.map((person) => (
            <div className='w-1/3 md:w-1/4 lg:w-1/6' key={person.name}>
              <PersonItem person={person} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonItem(props: { person: any }) {
  const { person } = props;
  const screenSize = useScreenSize();

  const [cardStyle, setCardStyle] = useState({
    scale: 1,
    rotation: 0,
  });

  const handleMouseEnter = async () => {
    setCardStyle({ scale: 1.1, rotation: 5 });
    await delay(100);
    setCardStyle({ scale: 1.05, rotation: -5 });
    await delay(100);
    setCardStyle({ scale: 1, rotation: 0 });
  };

  const handleMouseLeave = async () => {
    setCardStyle({ scale: 1, rotation: 0 });
  };
  return (
    <li className='flex flex-col items-center' key={person.name}>
      <div
        className='flex flex-col items-center transition-all'
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `scale(${cardStyle.scale}) rotate(${cardStyle.rotation}deg)`,
        }}
      >
        <div
          className='flex overflow-hidden rounded-full object-cover'
          style={{
            width: adjustWeb(160, screenSize, 0.75),
            height: adjustWeb(160, screenSize, 0.75),
          }}
        >
          <Image src={person.imageUrl} alt='' />
        </div>
        <h3 className='text-text-primary mt-6 text-base font-bold leading-7 tracking-tight'>
          {person.name}
        </h3>
        <p className='text-text-primary text-sm leading-6'>{person.role}</p>
      </div>

      <div className='mt-2 flex flex-row gap-2'>
        {person.twitter && (
          <a href={person.twitter} target='_blank' rel='noreferrer'>
            <FontAwesomeIcon
              color='rgb(156 163 175'
              icon={faTwitter}
              size={24}
            />
          </a>
        )}
        {person.linkedIn && (
          <a href={person.linkedIn} target='_blank' rel='noreferrer'>
            <FontAwesomeIcon
              color='rgb(156 163 175'
              icon={faLinkedin}
              size={24}
            />
          </a>
        )}
      </div>
    </li>
  );
}
