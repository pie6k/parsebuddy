import { createParserFactory } from '~/base/parser';
import { startsWith } from '~/utils/strings';

interface LiteralOptions {
  text: string;
  isCaseSensitive?: boolean;
}

export const literal = createParserFactory<LiteralOptions, string>(
  async function*(
    branch,
    { options: { text, marker, isCaseSensitive }, emit },
  ) {
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
  { name: 'literal' },
);
