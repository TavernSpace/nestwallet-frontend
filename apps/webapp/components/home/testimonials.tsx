import abiProfPic from '@nestwallet/app/assets/images/home/testimonials/abi.png';
import adamProfPic from '@nestwallet/app/assets/images/home/testimonials/adam.png';
import lornyProfile from '@nestwallet/app/assets/images/home/testimonials/lorny.png';
import lukasProfPic from '@nestwallet/app/assets/images/home/testimonials/lukasschor.png';
import naniProfPic from '@nestwallet/app/assets/images/home/testimonials/nani.png';
import orangeDaoLogo from '@nestwallet/app/assets/images/home/testimonials/orangedao.png';
import safeLogo from '@nestwallet/app/assets/images/home/testimonials/safe_logo.png';
import tongProfPic from '@nestwallet/app/assets/images/home/testimonials/tong.png';
import cn from 'classnames';
import Animated, { FadeIn } from 'react-native-reanimated';
// Lukas, Adam, Abi, Tong, OrangeDAO, Google Reviews
import Image from 'next/image';

const featuredTestimonial = [
  {
    body: 'For everyone who asked wen @Safe browser extension ?, check this out! Nest Wallet is a user-friendly browser extension for Safe which works with any dApp that supports MM🦊.',
    author: {
      name: 'lukasschor.eth | Safe',
      handle: 'SchorLukas',
      imageUrl: lukasProfPic,
      logoUrl: safeLogo,
    },
  },
];

const testimonials = [
  [
    [
      {
        delay: 200,
        body: "I'm excited for more tools like Nest Wallet that make using @safe accounts easier with browser extensions and add-ons. Nest is building a great UX on top of Safe so that you continue to have the strong security benefits of native Safe accounts with easy management tools.",
        author: {
          name: 'AdamHurwitz.eth',
          handle: 'adamshurwitz',
          imageUrl: adamProfPic,
        },
      },
      {
        delay: 100,
        body: 'Laborum quis quam. Dolorum et ut quod quia. Voluptas numquam delectus nihil. Aut enim doloremque et ipsam.',
        author: {
          name: 'Tong | Founder of Hologram',
          handle: 'tong0x',
          imageUrl: tongProfPic,
        },
      },
    ],
    [
      {
        delay: 350,
        body: 'Aut reprehenderit voluptatem eum asperiores beatae id. Iure molestiae ipsam ut officia rem nulla blanditiis.',
        author: {
          name: 'nani',
          handle: 'naniXBT',
          imageUrl: naniProfPic,
        },
      },
      // More testimonials...
    ],
  ],
  [
    [
      {
        delay: 150,
        body: 'Fantastic UX for my Safes!',
        author: {
          name: 'Abi Dharshan',
          handle: 'abishekinguout',
          imageUrl: abiProfPic,
        },
      },
      // More testimonials...
    ],
    [
      {
        delay: 300,
        body: 'Molestias ea earum quos nostrum doloremque sed. Quaerat quasi aut velit incidunt excepturi rerum voluptatem minus harum.',
        author: {
          name: 'Orange DAO',
          handle: 'OrangeDAOxyz',
          imageUrl: orangeDaoLogo,
        },
      },
      {
        delay: 250,
        body: "🪅Props to our @safe Grantee @nestwalletxyz for launching the Nest Wallet Browser Chrome Extension.👛 It's so easy to use and has incredibly smooth onboarding and a slick UX. Try it out now 🚀http://nestwallet.xyz",
        author: {
          name: 'Lorny P',
          handle: 'lornyelle',
          imageUrl: lornyProfile,
        },
      },
    ],
  ],
];

export default function Testimonials() {
  return (
    <div className='bg-background py-8 sm:py-16 lg:py-24 '>
      <div className='mx-auto max-w-7xl px-8 lg:px-8'>
        <div className='mx-auto max-w-xl text-center'>
          <h2 className='text-primary text-lg font-bold'>Testimonials</h2>
          <p className='text-text-primary mt-2 text-3xl font-bold tracking-tight sm:text-4xl'>
            See what people are saying about us
          </p>
        </div>
        <div className='mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm leading-6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4'>
          {featuredTestimonial.map((testimonial) => (
            <>
              <figure className='rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5 sm:col-span-2 xl:col-start-2 xl:row-end-1'>
                <blockquote className='p-6 text-lg font-bold leading-7 tracking-tight text-gray-900 sm:p-12 sm:text-xl sm:leading-8'>
                  <p>{`“${testimonial.body}”`}</p>
                </blockquote>
                <figcaption className='flex flex-wrap items-center gap-x-4 gap-y-4 border-t border-gray-900/10 px-6 py-4 sm:flex-nowrap'>
                  <Image
                    className='h-10 w-10 flex-none rounded-full bg-gray-50'
                    src={testimonial.author.imageUrl}
                    alt=''
                  />
                  <div className='flex-auto'>
                    <div className='font-bold'>{testimonial.author.name}</div>
                    <div className='text-gray-600'>{`@${testimonial.author.handle}`}</div>
                  </div>
                  <Image
                    className='h-10 w-auto flex-none'
                    src={testimonial.author.logoUrl}
                    alt=''
                  />
                </figcaption>
              </figure>
            </>
          ))}

          {testimonials.map((columnGroup, columnGroupIdx) => (
            <div
              key={columnGroupIdx}
              className='space-y-8 xl:contents xl:space-y-0'
            >
              {columnGroup.map((column, columnIdx) => (
                <div
                  key={columnIdx}
                  className={cn(
                    (columnGroupIdx === 0 && columnIdx === 0) ||
                      (columnGroupIdx === testimonials.length - 1 &&
                        columnIdx === columnGroup.length - 1)
                      ? 'xl:row-span-2'
                      : 'xl:row-start-1',
                    'space-y-8',
                  )}
                >
                  {column.map((testimonial, testimonialIndex) => (
                    <Animated.View key={testimonialIndex} entering={FadeIn}>
                      <div className='rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5'>
                        <blockquote className='text-gray-900'>
                          <p>{`“${testimonial.body}”`}</p>
                        </blockquote>
                        <figcaption className='mt-6 flex items-center gap-x-4'>
                          <Image
                            className='h-10 w-10 rounded-full bg-gray-50'
                            src={testimonial.author.imageUrl}
                            alt=''
                          />
                          <div>
                            <div className='font-bold'>
                              {testimonial.author.name}
                            </div>
                            <div className='text-gray-600'>{`@${testimonial.author.handle}`}</div>
                          </div>
                        </figcaption>
                      </div>
                    </Animated.View>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
