import { createParserFactory, ParsingBranch } from '~/base/parser';
import { literal } from '../literal';

interface WordOptions {
  text?: string;
}

function verifyAndPrepareBranchForWordStart<Marker>(
  branch: ParsingBranch<any, Marker>,
  marker: Marker,
) {
  const matchedInput = branch.getMatchedInput();
  const input = branch.getInput();

  // if its brand new branch - we dont require whitespace on start - it's ok
  if (!branch.hasMatches()) {
    return branch;
  }

  if (matchedInput.endsWith(' ')) {
    return branch;
  }

  if (input && !input.startsWith(' ')) {
    return;
  }

  if (!input || input.startsWith(' ')) {
    branch.addMatch({ content: ' ', type: 'whitespace', marker });
  }

  return branch;
}

function addWhitespaceSuggestionIfNeeded(branch: ParsingBranch<any, any>) {}

function isBranchCorrectWordEnd(branch: ParsingBranch<any, any>) {
  if (!branch.hasMoreInput()) {
    return true;
  }

  const input = branch.getInput();

  if (input.startsWith(' ')) {
    return true;
  }

  return false;
}

export const word = createParserFactory<WordOptions, string>(
  async function*(branch, { options: { children, marker, text } }) {
    const preparedBranch = verifyAndPrepareBranchForWordStart(branch, marker);

    if (!preparedBranch) {
      return;
    }

    const parser = text ? literal({ text, marker }) : children[0];

    for await (const newBranch of parser(branch.clone())) {
      if (!newBranch.hasMoreInput()) {
        yield newBranch;
      }

      const newBranchInput = newBranch.getInput();

      if (newBranchInput.startsWith(' ')) {
        yield newBranch.addMatch({ content: ' ', type: 'whitespace', marker });
        continue;
      }

      if (newBranch.getMatchedInput().endsWith(' ')) {
        yield newBranch;
      }
    }
  },
  {
    name: 'word',
    areOptionsValid: (options) => {
      if (options.text && options.children) {
        throw new Error('Word parser cannot have both text and children');
      }

      if (!options.text && !options.children) {
        throw new Error('Word parser require either text or children');
      }

      if (options.children && options.children.length !== 1) {
        throw new Error('Word parser can have exactly one children');
      }
    },
  },
);
