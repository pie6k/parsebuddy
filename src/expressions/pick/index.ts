import { createParserFactory, Parser, ParsingBranch } from '../../base/parser';
interface PickOptions {
  limit?: number;
}

async function* childrenBranchesCombinations(
  parsers: Parser<any>[],
  rootBranch: ParsingBranch,
): AsyncIterableIterator<ParsingBranch> {
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
    if (!chilrenParsers || !chilrenParsers[0]) {
      throw new Error(`pick parser requires at least one child parser`);
    }

    let yielded = 0;
    for await (let choosenBranch of childrenBranchesCombinations(
      chilrenParsers,
      branch,
    )) {
      if (limit !== undefined && limit > 0 && ++yielded > limit) {
        return;
      }
      yield choosenBranch;
    }
  },
  { name: 'pick' },
);
