import { createParserFactory } from '~/base/parser';
import { startsWith } from '~/utils/strings';

function isWithinLimits(
  number: number,
  min: number = null,
  max: number = null,
) {
  if (min !== null && number < min) {
    return false;
  }
  if (max !== null && number > max) {
    return false;
  }
  return true;
}

interface NumberOptions {
  min?: number;
  max?: number;
  ignoreNegative?: boolean;
  onlyInteger?: boolean;
}

const numRegExpFollowedByWhitespace = /^(\d+)(?:$|\s)/;
const numRegExp = /^(\d+)/;

const floatNumRegExp = /^-?\d+([\.\,]\d+)?/;
const intNumRegExp = /^-?\d+/;

function unifyNumberStringForParsing(input: string) {
  input = input.replace(',', '.');

  return input;
}

export const number = createParserFactory<NumberOptions, number>(
  async function*(
    branch,
    { options: { marker, min, max, onlyInteger, ignoreNegative }, emit },
  ) {
    const input = branch.getInput();

    const checkingRegExp = onlyInteger ? intNumRegExp : floatNumRegExp;

    const numberMatch = checkingRegExp.exec(input);

    if (numberMatch === null) {
      return;
    }

    const [numAsString] = numberMatch;

    const number = parseFloat(unifyNumberStringForParsing(numAsString));

    if (ignoreNegative && number < 0) {
      return;
    }

    if (!isWithinLimits(number, min, max)) {
      return;
    }
    emit(number);
    yield branch.addMatch({ content: numAsString, type: 'input' });
  },
  { name: 'number' },
);
