import { NumberType } from './types';

const numberFormatCache: Record<string, Intl.NumberFormat> = {};

function getNumberFormat({
  name,
  props,
}: {
  name: string;
  props: Parameters<typeof Intl.NumberFormat>[1];
}): Intl.NumberFormat {
  const locale = 'en-US';
  const key = `${locale}--${props?.currency ?? 'NONE'}--${name}}`;

  let format = numberFormatCache[key];

  if (format) {
    return format;
  }

  format = new Intl.NumberFormat(locale, props);
  numberFormatCache[key] = format;
  return format;
}

export const StandardCurrency: FormatCreator = {
  createFormat(currencyCode) {
    return getNumberFormat({
      name: 'StandardCurrency',
      props: {
        notation: 'standard',
        style: 'currency',
        currency: currencyCode,
      },
    });
  },
};

export const SmallestNumCurrency: FormatCreator = {
  createFormat(currencyCode) {
    return getNumberFormat({
      name: 'SmallestNumCurrency',
      props: {
        notation: 'standard',
        maximumFractionDigits: 20, // max allowed digits
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const FourDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'FourDecimals',
      props: {
        notation: 'standard',
        maximumFractionDigits: 4,
      },
    });
  },
};

export const ThreeDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeDecimals',
      props: {
        notation: 'standard',
        maximumFractionDigits: 3,
      },
    });
  },
};

export const TwoDecimalsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimalsCurrency',
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const ThreeDecimalsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimalsCurrency',
      props: {
        notation: 'standard',
        maximumFractionDigits: 3,
        minimumFractionDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const ShorthandTwoDecimalsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandTwoDecimalsCurrency',
      props: {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const TwoOrThreeSigFigsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoOrThreeSigFigsCurrency',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 3,
        minimumSignificantDigits: 2,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const ThreeSigFigsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeSigFigsCurrency',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 3,
        minimumSignificantDigits: 3,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const MaximumThreeSigFigsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'MaximumThreeSigFigsCurrency',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 3,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const ThreeFourSigFigsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ThreeFourSigFigsCurrency',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 4,
        minimumSignificantDigits: 3,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const FourSigFigsCurrency: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'FourSigFigsCurrency',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 4,
        minimumSignificantDigits: 4,
        currency: currencyCode,
        style: 'currency',
      },
    });
  },
};

export const MaximumThreeSigFigsDecimals: FormatCreator = {
  createFormat: (currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'MaximumThreeSigFigs',
      props: {
        notation: 'standard',
        maximumSignificantDigits: 3,
      },
    });
  },
};

export const TwoDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimals',
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      },
    });
  },
};

export const OneOrTwoDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'OneOrTwoDecimals',
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
        minimumFractionDigits: 1,
      },
    });
  },
};

export const MaximumTwoDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'MaximumTwoDecimals',
      props: {
        notation: 'standard',
        maximumFractionDigits: 2,
      },
    });
  },
};

export const ShorthandTwoDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandTwoDecimals',
      props: {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    });
  },
};

export const MaximumShorthandTwoDecimals: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'MaximumShorthandTwoDecimals',
      props: {
        notation: 'compact',
        maximumFractionDigits: 2,
      },
    });
  },
};

export const ShorthandTwoDecimalsPercentage: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'ShorthandTwoDecimalsPercentage',
      props: {
        notation: 'compact',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        style: 'percent',
      },
    });
  },
};

export const NoTrailingDecimalsPercentages: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'NoTrailingDecimalsPercentages',
      props: {
        notation: 'standard',
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    });
  },
};

export const TwoDecimalsPercentages: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'TwoDecimalsPercentages',
      props: {
        notation: 'standard',
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    });
  },
};

export const CompactPercentages: FormatCreator = {
  createFormat: (_currencyCode: string): Intl.NumberFormat => {
    return getNumberFormat({
      name: 'CompactPercentages',
      props: {
        notation: 'compact',
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      },
    });
  },
};

export interface FormatCreator {
  /**
   * Creates a Intl.NumberFormat based off currency
   * @param currencyCode three letter ISO 4217 currency code e.g. "USD"
   * @returns created Intl.NumberFormat
   */
  createFormat: (currencyCode: string) => Intl.NumberFormat;
}
export type Format = string | FormatCreator;

// each rule must contain either an `upperBound` or an `exact` value.
// upperBound => number will use that formatter as long as it is < upperBound
// exact => number will use that formatter if it is === exact
export type FormatterRule =
  | {
      upperBound?: undefined;
      exact: number;
      match?: undefined;
      formatter: Format;
      overrideValue?: number;
      postFormatModifier?: (formatted: string) => string;
    }
  | {
      upperBound: number;
      exact?: undefined;
      match?: undefined;
      formatter: Format;
      overrideValue?: number;
      postFormatModifier?: (formatted: string) => string;
    }
  | {
      upperBound?: undefined;
      exact?: undefined;
      match: (input: number) => boolean;
      formatter: Format;
      overrideValue?: number;
      postFormatModifier?: (formatted: string) => string;
    };

// these formatter objects dictate which formatter rule to use based on the interval that
// the number falls into. for example, based on the rule set below, if your number
// falls between 1 and 1e6, you'd use TwoDecimals as the formatter.
export const tokenNonTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.0001, formatter: '<0.0001' },
  { upperBound: 1, formatter: FourDecimals },
  { upperBound: 1e6, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
];

export const tokenTxFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 0.0001, formatter: '<0.0001' },
  { upperBound: 1, formatter: FourDecimals },
  {
    match: (input) => Number.isInteger(input) && input < 1e6,
    formatter: MaximumTwoDecimals,
  },
  { upperBound: 1e6, formatter: OneOrTwoDecimals },
  { upperBound: 1e15, formatter: MaximumShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
];

export const tokenExactFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0' },
  { upperBound: 1, formatter: MaximumThreeSigFigsDecimals },
  { upperBound: 1e6, formatter: TwoDecimals },
  { upperBound: 1e15, formatter: ShorthandTwoDecimals },
  { upperBound: Infinity, formatter: '>999T' },
];

export const fiatTokenPricesFormatter: FormatterRule[] = [
  { exact: 0, formatter: StandardCurrency },
  {
    upperBound: 0.00000001,
    overrideValue: 0.00000001,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `$0.00`,
  },
  { upperBound: 0.1, formatter: MaximumThreeSigFigsCurrency },
  { upperBound: 0.999, formatter: TwoOrThreeSigFigsCurrency },
  { upperBound: 1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1e5, formatter: TwoDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
];

export const fiatTokenExactPricesFormatter: FormatterRule[] = [
  { exact: 0, formatter: StandardCurrency },
  {
    upperBound: 0.00000001,
    overrideValue: 0.00000001,
    formatter: SmallestNumCurrency,
    postFormatModifier: (formatted: string) => `$0.00`,
  },
  { upperBound: 0.1, formatter: ThreeFourSigFigsCurrency },
  { upperBound: 0.999, formatter: FourSigFigsCurrency },
  { upperBound: 1, formatter: ThreeSigFigsCurrency },
  { upperBound: 1e5, formatter: ThreeDecimalsCurrency },
  { upperBound: Infinity, formatter: ShorthandTwoDecimalsCurrency },
];

const percentageToDecimal = (percentage: number) => percentage / 100;

export const percentagesFormatter: FormatterRule[] = [
  { exact: 0, formatter: '0.00%' },
  { upperBound: percentageToDecimal(0.0001), formatter: '0.00%' },
  { upperBound: percentageToDecimal(0.01), formatter: TwoDecimalsPercentages },
  {
    upperBound: percentageToDecimal(1e5),
    formatter: NoTrailingDecimalsPercentages,
  },
  { upperBound: Infinity, formatter: CompactPercentages },
];

export const shorthandFormatter: FormatterRule[] = [
  { upperBound: Infinity, formatter: MaximumShorthandTwoDecimals },
];

export const TYPE_TO_FORMATTER_RULES = {
  [NumberType.TokenNonTx]: tokenNonTxFormatter,
  [NumberType.TokenTx]: tokenTxFormatter,
  [NumberType.TokenExact]: tokenExactFormatter,
  [NumberType.FiatTokenPrice]: fiatTokenPricesFormatter,
  [NumberType.FiatTokenExactPrice]: fiatTokenExactPricesFormatter,
  [NumberType.Percentage]: percentagesFormatter,
  [NumberType.Shorthand]: shorthandFormatter,
};
