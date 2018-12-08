import { createParserFactory, ParsingBranch } from '../../base/parser';

export const sequence = createParserFactory<{}, string>(
  async function*(branch, { options: { children, marker } }) {
    // we start with origin branch, but it may spread on every element of sequence
    let survivingBranches = [branch];

    // lets iterate over sequence elements
    for (let child of children) {
      // at first assume no branch survived each step
      let newBranches: ParsingBranch<any, any>[] = [];
      // for every remaining branch
      for (let survivingBranch of survivingBranches) {
        // get all resulting branches and mark them as new branches from this step
        for await (const newBranch of child(survivingBranch)) {
          newBranches.push(newBranch);
        }
      }

      // all branches that are results of this step will be passed to next sequence element
      survivingBranches = newBranches;
    }

    yield* survivingBranches;
  },
  { name: 'sequence' },
);
