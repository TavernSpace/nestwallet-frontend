import QRCodeUtil, { QRCodeErrorCorrectionLevel } from 'qrcode';
import { useMemo } from 'react';
import Svg, { Circle, ClipPath, Defs, G, Image, Rect } from 'react-native-svg';
import LogoImage from '../../assets/images/logos/nest-logo.png';

const generateMatrix = (
  value: string,
  errorCorrectionLevel: QRCodeErrorCorrectionLevel,
) => {
  const arr = QRCodeUtil.create(value, {
    errorCorrectionLevel,
  }).modules.data.slice(0);
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce<number[][]>((rows, key, index) => {
    if (index % sqrt === 0) {
      rows.push([key]);
    } else {
      rows[rows.length - 1]!.push(key);
    }
    return rows;
  }, []);
};

export const QRCode = ({
  ecl = 'H' as QRCodeErrorCorrectionLevel,
  logo = LogoImage,
  logoBackgroundColor = 'transparent',
  logoMargin = -5,
  logoSize = 100,
  logoPadding = 20,
  size = 300,
  value = 'QR Code',
}) => {
  const dots = useMemo(() => {
    const dots: React.ReactNode[] = [];
    const matrix = generateMatrix(value, ecl);
    const cellSize = size / matrix.length;
    const qrList = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    let key = 0;
    qrList.forEach(({ x, y }) => {
      const x1 = (matrix.length - 7) * cellSize * x;
      const y1 = (matrix.length - 7) * cellSize * y;
      for (let i = 0; i < 3; i++) {
        dots.push(
          <Rect
            key={key}
            fill={i % 2 !== 0 ? 'white' : 'black'}
            height={cellSize * (7 - i * 2)}
            rx={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
            ry={(i - 3) * -6 + (i === 0 ? 2 : 0)} // calculated border radius for corner squares
            width={cellSize * (7 - i * 2)}
            x={x1 + cellSize * i}
            y={y1 + cellSize * i}
          />,
        );
        key += 1;
      }
    });

    const clearArenaSize = Math.floor((logoSize + 3) / cellSize);
    const matrixMiddleStart = matrix.length / 2 - clearArenaSize / 2;
    const matrixMiddleEnd = matrix.length / 2 + clearArenaSize / 2 - 1;

    matrix.forEach((row, i) => {
      row.forEach((column, j) => {
        if (matrix[i]![j]) {
          if (
            !(
              (i < 7 && j < 7) ||
              (i > matrix.length - 8 && j < 7) ||
              (i < 7 && j > matrix.length - 8)
            )
          ) {
            if (
              !(
                i > matrixMiddleStart &&
                i < matrixMiddleEnd &&
                j > matrixMiddleStart &&
                j < matrixMiddleEnd &&
                i < j + clearArenaSize / 2 &&
                j < i + clearArenaSize / 2 + 1
              )
            ) {
              dots.push(
                <Circle
                  key={key}
                  cx={i * cellSize + cellSize / 2}
                  cy={j * cellSize + cellSize / 2}
                  fill='black'
                  r={cellSize / 3} // calculate size of single dots
                />,
              );
              key += 1;
            }
          }
        }
      });
    });
    return dots;
  }, [ecl, logoSize, size, value]);

  const logoPosition = size / 2 - (logoSize - logoPadding) / 2 - logoMargin;
  const logoWrapperSize = logoSize + logoMargin * 2;

  return (
    <Svg height={size} width={size}>
      <Defs>
        <ClipPath id='clip-wrapper'>
          <Rect height={logoWrapperSize} width={logoWrapperSize} />
        </ClipPath>
        <ClipPath id='clip-logo'>
          <Rect height={logoSize} width={logoSize} />
        </ClipPath>
      </Defs>
      <Rect fill='white' height={size} width={size} rx={20} />
      {dots}
      {logo && (
        <G x={logoPosition} y={logoPosition}>
          <Rect
            clipPath='url(#clip-wrapper)'
            fill={logoBackgroundColor}
            height={logoWrapperSize}
            width={logoWrapperSize}
          />
          <G x={logoMargin} y={logoMargin}>
            <Image
              clipPath='url(#clip-logo)'
              height={logoSize - logoPadding}
              href={logo}
              preserveAspectRatio='xMidYMid slice'
              width={logoSize - logoPadding}
            />
          </G>
        </G>
      )}
    </Svg>
  );
};
