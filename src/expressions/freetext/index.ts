import { createParserFactory } from '~/base/parser';

import { getSubstringsOfInput } from './services';

interface FreetextOptions {
  filter?: (input: string) => boolean;
  splitBy?: string[];
  maxLength?: number;
}

export const freetext = createParserFactory<FreetextOptions, string>(
  async function*(
    branch,
    { options: { marker, filter, splitBy, maxLength }, emit },
  ) {
    const input = branch.getInput();

    for (const variant of getSubstringsOfInput(input, splitBy)) {
      if (filter && !filter(variant)) {
        continue;
      }
      if (maxLength > 0 && variant.length > maxLength) {
        continue;
      }

      const variantWordsCount = variant.split(' ').length;
      const score = Math.pow(0.975, variantWordsCount + 1);

      emit(branch, variant);
      yield branch
        .clone()
        .addMatch({ content: variant, type: 'input', marker })
        .addScore(score);
    }
  },
  { name: 'freetext' },
);
