export function getPossibleNumbers(min: number, max: number): number[] {
  if (min === max) {
    return [min];
  }
  if (min > max) {
    return getPossibleNumbers(max, min);
  }

  const numbersCount = max - min + 1;

  return Array.from({ length: numbersCount }, (value, index) => min + index);
}

export function isWithinLimits(number: number, min?: number, max?: number) {
  if (min !== undefined && number < min) {
    return false;
  }
  if (max !== undefined && number > max) {
    return false;
  }
  return true;
}

export const numRegExpFollowedByWhitespace = /^(\d+)(?:$|\s)/;
export const numRegExp = /^(\d+)/;

export const floatNumRegExp = /^-?\d+([\.\,]\d+)?/;
export const intNumRegExp = /^-?\d+/;

export function unifyNumberStringForParsing(input: string) {
  input = input.replace(',', '.');

  return input;
}
