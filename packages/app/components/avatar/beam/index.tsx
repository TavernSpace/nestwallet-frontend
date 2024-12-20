import { G, Mask, Path, Rect, Svg } from 'react-native-svg';
import {
  getBoolean,
  getContrast,
  getNumber,
  getRandomColor,
  getUnit,
} from './utils';

export const defaultPalette = [
  '#264653',
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#e76f51',
];

function generateData(
  name: string,
  size: number,
  colors: string[] = defaultPalette,
) {
  const numFromName = getNumber(name);
  const range = colors && colors.length;
  const wrapperColor = getRandomColor(numFromName, colors, range);
  const preTranslateX = getUnit(numFromName, 10, 1);
  const wrapperTranslateX =
    preTranslateX < 5 ? preTranslateX + size / 9 : preTranslateX;
  const preTranslateY = getUnit(numFromName, 10, 2);
  const wrapperTranslateY =
    preTranslateY < 5 ? preTranslateY + size / 9 : preTranslateY;

  const data = {
    wrapperColor: wrapperColor,
    faceColor: getContrast(wrapperColor),
    backgroundColor: getRandomColor(numFromName + 13, colors, range),
    wrapperTranslateX: wrapperTranslateX,
    wrapperTranslateY: wrapperTranslateY,
    wrapperRotate: getUnit(numFromName, 360),
    wrapperScale: 1 + getUnit(numFromName, size / 12) / 10,
    isMouthOpen: getBoolean(numFromName, 2),
    isCircle: getBoolean(numFromName, 1),
    eyeSpread: getUnit(numFromName, 5),
    mouthSpread: getUnit(numFromName, 3),
    faceRotate: getUnit(numFromName, 10, 3),
    faceTranslateX:
      wrapperTranslateX > size / 6
        ? wrapperTranslateX / 2
        : getUnit(numFromName, 8, 1),
    faceTranslateY:
      wrapperTranslateY > size / 6
        ? wrapperTranslateY / 2
        : getUnit(numFromName, 7, 2),
  };

  return data;
}

interface IAvatarBeamProps {
  name: string;
  size: number;
  colors?: string[];
  square?: boolean;
}

export const AvatarBeam = (props: IAvatarBeamProps) => {
  const { name, size, colors, square } = props;

  const data = generateData(name, size, colors);

  return (
    <Svg
      viewBox={'0 0 ' + size + ' ' + size}
      fill='none'
      //xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
    >
      <Mask
        id='mask__beam'
        maskUnits='userSpaceOnUse'
        x={0}
        y={0}
        width={size}
        height={size}
      >
        <Rect
          width={size}
          height={size}
          rx={square ? undefined : size * 2}
          fill='white'
        />
      </Mask>
      {/* Prop is still called mask not Mask, spent too long on trying to catch this... */}
      <G mask='url(#mask__beam)'>
        <Rect width={size} height={size} fill={data.backgroundColor} />
        <Rect
          x='0'
          y='0'
          width={size}
          height={size}
          transform={
            'translate(' +
            data.wrapperTranslateX +
            ' ' +
            data.wrapperTranslateY +
            ') rotate(' +
            data.wrapperRotate +
            ' ' +
            size / 2 +
            ' ' +
            size / 2 +
            ') scale(' +
            data.wrapperScale +
            ')'
          }
          fill={data.wrapperColor}
          rx={data.isCircle ? size : size / 6}
        />
        <G
          transform={
            'translate(' +
            data.faceTranslateX +
            ' ' +
            data.faceTranslateY +
            ') rotate(' +
            data.faceRotate +
            ' ' +
            size / 2 +
            ' ' +
            size / 2 +
            ')'
          }
        >
          {data.isMouthOpen ? (
            <Path
              d={'M15 ' + (19 + data.mouthSpread) + 'c2 1 4 1 6 0'}
              stroke={data.faceColor}
              fill='none'
              strokeLinecap='round'
            />
          ) : (
            <Path
              d={'M13,' + (19 + data.mouthSpread) + ' a1,0.75 0 0,0 10,0'}
              fill={data.faceColor}
            />
          )}
          <Rect
            x={14 - data.eyeSpread}
            y={14}
            width={1.5}
            height={2}
            rx={1}
            stroke='none'
            fill={data.faceColor}
          />
          <Rect
            x={20 + data.eyeSpread}
            y={14}
            width={1.5}
            height={2}
            rx={1}
            stroke='none'
            fill={data.faceColor}
          />
        </G>
      </G>
    </Svg>
  );
};
