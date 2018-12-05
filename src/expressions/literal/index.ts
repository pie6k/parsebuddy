import {
  createParserFactory,
  ParsingBranch,
  ParserOptions,
} from '~/base/parser';
import { startsWith, fuzzyMatch } from '~/utils/strings';

interface LiteralOptions {
  text: string;
  isFuzzy?: boolean;
  isCaseSensitive?: boolean;
}

async function* parseAsFuzzy(
  branch: ParsingBranch<any, any>,
  { text, marker, isCaseSensitive }: ParserOptions<LiteralOptions, any, any>,
) {
  const input = branch.getInput();
  const fuzzyMatchData = fuzzyMatch(input, text, { isCaseSensitive });

  if (!fuzzyMatchData) {
    return;
  }

  for (const fuzzyMatch of fuzzyMatchData) {
    const { content, type } = fuzzyMatch;
    branch.addMatch({ content, type, marker });
  }
  yield branch;
}

export const literal = createParserFactory<LiteralOptions, string>(
  async function*(branch, { options, emit }) {
    const { text, marker, isCaseSensitive, isFuzzy } = options;

    if (isFuzzy) {
      return yield* parseAsFuzzy(branch, options);
    }

    const input = branch.getInput();
    const startsWithResult = startsWith(input, text, {
      caseSensitive: isCaseSensitive,
    });

    if (!startsWithResult) {
      const resultWithSuggestion = startsWith(text, input, {
        caseSensitive: isCaseSensitive,
      });

      if (!resultWithSuggestion) {
        return;
      }
      const [matchedInput, suggestionNeededToMatch] = resultWithSuggestion;
      // it is possible that entire match is suggestion
      if (matchedInput) {
        branch.addMatch({ content: matchedInput, marker, type: 'input' });
      }
      branch.addMatch({
        content: suggestionNeededToMatch,
        marker,
        type: 'suggestion',
      });
      return yield branch;
    }

    emit(text);
    yield branch.addMatch({ content: text, marker, type: 'input' });
  },
  {
    name: 'literal',
  },
);
