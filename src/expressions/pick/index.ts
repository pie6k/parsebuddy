import { createParserFactory, Parser, ParsingBranch } from '~/base/parser';
interface PickOptions {
  limit?: number;
}

async function* childrenBranchesCombinations(
  parsers: Parser<any, any, any>[],
  rootBranch: ParsingBranch<any, any>,
): AsyncIterableIterator<ParsingBranch<any, any>> {
  for (let parser of parsers) {
    const childBranches = parser(rootBranch.clone());
    for await (let childBranch of childBranches) {
      yield childBranch;
      yield* childrenBranchesCombinations(
        parsers.filter((singleChild) => singleChild !== parser),
        childBranch,
      );
    }
  }
}

export const pick = createParserFactory<PickOptions, string>(
  async function*(
    branch,
    { options: { children: chilrenParsers, marker, limit } },
  ) {
    let yielded = 0;
    for await (let choosenBranch of childrenBranchesCombinations(
      chilrenParsers,
      branch,
    )) {
      if (limit > 0 && ++yielded > limit) {
        return;
      }
      yield choosenBranch;
    }
  },
  { name: 'pick' },
);
