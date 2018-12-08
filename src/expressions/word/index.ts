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
  const originalInput = branch.getOriginalInput();

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

  if (!input) {
    return branch.addMatch({ content: ' ', type: 'suggestion', marker });
  }

  if (input.startsWith(' ')) {
    return branch.addMatch({ content: ' ', type: 'input', marker });
  }

  return branch;
}

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

    for await (const newBranch of parser(preparedBranch.clone())) {
      if (!newBranch.hasMoreInput()) {
        newBranch.addMatch({ content: ' ', type: 'suggestion', marker });
        yield newBranch;
        continue;
      }

      if (newBranch.getMatchedInput().endsWith(' ')) {
        yield newBranch;
        continue;
      }

      if (newBranch.getInput().startsWith(' ')) {
        yield newBranch.addMatch({ content: ' ', type: 'input', marker });
        continue;
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
