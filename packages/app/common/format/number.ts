import { formatUnits } from 'ethers';
import { FormatterRule, TYPE_TO_FORMATTER_RULES } from './number-formats';
import { NumberType } from './types';

function getFormatterRule(input: number, type: NumberType): FormatterRule {
  const rules = TYPE_TO_FORMATTER_RULES[type];
  for (const rule of rules) {
    if (
      (rule.match !== undefined && rule.match(input)) ||
      (rule.exact !== undefined && input === rule.exact) ||
      (rule.upperBound !== undefined && input < rule.upperBound)
    ) {
      return rule;
    }
  }

  throw new Error(`formatter for type ${type} not configured correctly`);
}

export function formatNumber({
  input,
  currencyCode = 'USD',
  type = NumberType.TokenNonTx,
  placeholder = '-',
}: {
  input: number | null | undefined;
  currencyCode?: string;
  type?: NumberType;
  placeholder?: string;
}): string {
  if (input === null || input === undefined) {
    return placeholder;
  }

  const { formatter, overrideValue, postFormatModifier } = getFormatterRule(
    input,
    type,
  );
  if (typeof formatter === 'string') {
    return formatter;
  }

  const createdFormat = formatter.createFormat(currencyCode);
  const formatted = createdFormat.format(
    overrideValue !== undefined ? overrideValue : input,
  );
  return postFormatModifier ? postFormatModifier(formatted) : formatted;
}

export function formatMoney(
  amount: number | null | undefined,
  type: NumberType = NumberType.FiatTokenPrice,
): string {
  const placeholder = '-';

  if (
    amount === null ||
    amount === undefined ||
    amount === Infinity ||
    isNaN(amount)
  ) {
    return placeholder;
  }

  if (
    type === NumberType.FiatTokenExactPrice &&
    amount < 0.0001 &&
    amount !== 0
  ) {
    return formatNumberWithSubscriptZeros(amount);
  }

  return formatNumber({
    input: amount,
    type,
    placeholder,
  });
}

function formatNumberWithSubscriptZeros(amount: number): string {
  if (amount >= 0.0001) {
    return formatNumber({
      input: amount,
      type: NumberType.FiatTokenPrice,
      placeholder: '-',
    });
  }
  const numberStr = amount.toFixed(20);
  const leadingZerosMatch = numberStr.match(/^0\.(0+)/);
  if (!leadingZerosMatch || leadingZerosMatch.length < 2) {
    return formatNumber({
      input: amount,
      type: NumberType.FiatTokenPrice,
      placeholder: '-',
    });
  }
  const leadingZerosCount = leadingZerosMatch[1]!.length;
  const remainingDigits = numberStr.slice(leadingZerosMatch[0].length);

  const smallCount = String(leadingZerosCount)
    .split('')
    .map((digit) => String.fromCharCode(8320 + parseInt(digit)))
    .join('');

  return `$0.0${smallCount}${remainingDigits.slice(0, 4)}`;
}

export function formatCrypto(
  amount: bigint | string | number | null | undefined,
  decimals: number,
  type: NumberType = NumberType.TokenNonTx,
  placeholder: string = '-',
): string {
  if (amount === null || amount === undefined) {
    return placeholder;
  }

  const formattedAmount = formatUnits(amount, decimals);

  return formatNumber({
    input: parseFloat(formattedAmount),
    type,
    placeholder,
  });
}

export function formatCryptoBig(
  amount: string,
  type: NumberType = NumberType.TokenNonTx,
  placeholder: string = '-',
): string {
  if (amount === null || amount === undefined) {
    return placeholder;
  }

  return formatNumber({
    input: parseFloat(amount),
    type,
    placeholder,
  });
}

export function formatCryptoFloat(
  amount: number,
  type: NumberType = NumberType.TokenNonTx,
  placeholder: string = '-',
): string {
  return formatNumber({
    input: amount,
    type,
    placeholder,
  });
}

export function formatPercentage(
  rawPercentage?: number | string | null,
): string {
  if (rawPercentage === null || rawPercentage === undefined) return '-';
  if (rawPercentage === Infinity || rawPercentage === -Infinity) return '∞';
  const percentage =
    typeof rawPercentage === 'string'
      ? parseFloat(rawPercentage)
      : parseFloat(rawPercentage.toString());
  const formatted = formatNumber({
    input: percentage / 100,
    type: NumberType.Percentage,
  });
  return formatted.endsWith('%') ? formatted : `${formatted}%`;
}
