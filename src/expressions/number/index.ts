import { createParserFactory, ParsingBranch, ParserExecutorData } from '../..';
import { startsWith } from '../../utils/strings';

import {
  floatNumRegExp,
  getPossibleNumbers,
  intNumRegExp,
  isWithinLimits,
  numRegExp,
  numRegExpFollowedByWhitespace,
  unifyNumberStringForParsing,
} from './services';
import { fork } from '../fork';
import { literal } from '../literal';

interface NumberOptions {
  min: number;
  max: number;
  generateSuggestions?: boolean;
  onlyInteger?: boolean;
}

async function* parseWithSuggestions(
  branch: ParsingBranch,
  { options: { min, max }, emit }: ParserExecutorData<NumberOptions, number>,
) {
  const input = branch.getInput();
  const possibleNumbers = getPossibleNumbers(min, max);

  let matchedNumber = 0;

  const parser = fork({
    children: possibleNumbers.map((possibleNumber) => {
      return literal({
        text: `${possibleNumber}`,
        onMatch: () => {
          matchedNumber = possibleNumber;
        },
      });
    }),
  });

  for await (let result of parser(branch)) {
    const matches = result.getMatches();
    const lastMatch = matches[matches.length - 1];

    const number = parseFloat(lastMatch.content);
    if (lastMatch.type === 'input') {
      emit(number);
    }
    yield result;
  }
}

export const number = createParserFactory<NumberOptions, number>(
  async function*(branch, { options, emit }) {
    const { marker, min, max, onlyInteger, generateSuggestions } = options;

    if (onlyInteger && generateSuggestions) {
      return yield* parseWithSuggestions(branch, { options, emit });
    }

    const input = branch.getInput();
    const checkingRegExp = onlyInteger ? intNumRegExp : floatNumRegExp;
    const numberMatch = checkingRegExp.exec(input);

    if (numberMatch === null) {
      return;
    }

    const [numAsString] = numberMatch;
    const number = parseFloat(unifyNumberStringForParsing(numAsString));

    if (!isWithinLimits(number, min, max)) {
      return;
    }

    emit(number);
    yield branch.addMatch({ content: numAsString, type: 'input', marker });
  },
  {
    name: 'number',
    defaultOptions: { onlyInteger: false },
    areOptionsValid: (options) => {
      if (options.generateSuggestions && !options.onlyInteger) {
        throw new Error(
          'Number parser that generates suggestions must have option onlyInteger set to true.',
        );
      }
    },
  },
);
