import { createParserFactory } from '../../base/parser';
import { startsWith } from '../../utils/strings';

interface WhitespaceOptions {}

const whiteSpaceRegExp = /^\s+/;

export const whitespace = createParserFactory<WhitespaceOptions, string>(
  async function*(branch, { options: { marker }, emit }) {
    const input = branch.getInput();

    const whiteSpaceMatch = whiteSpaceRegExp.exec(input);

    if (whiteSpaceMatch === null) {
      return;
    }

    const [whiteSpacePart] = whiteSpaceMatch;

    emit(whiteSpacePart);
    yield branch.addMatch({ content: whiteSpacePart, type: 'input', marker });
  },
  { name: 'whitespace' },
);
