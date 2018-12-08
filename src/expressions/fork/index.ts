import { createParserFactory } from '../..';

export const fork = createParserFactory<{}, string>(
  async function*(branch, { options: { children: chilrenParsers, marker } }) {
    for (let childParser of chilrenParsers) {
      for await (const newBranch of childParser(branch.clone())) {
        yield newBranch;
      }
    }
  },
  { name: 'fork' },
);
