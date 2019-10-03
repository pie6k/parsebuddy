import { createParserFactory } from '../..';

export const fork = createParserFactory<{}, string>(
  async function*(branch, { options: { children: chilrenParsers, marker } }) {
    if (!chilrenParsers || !chilrenParsers[0]) {
      throw new Error(`pick parser requires at least one child parser`);
    }

    for (let childParser of chilrenParsers) {
      for await (const newBranch of childParser(branch.clone())) {
        yield newBranch;
      }
    }
  },
  { name: 'fork' },
);
