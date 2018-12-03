import { createParserFactory } from '~/base/parser';

export const optional = createParserFactory<{}, never>(
  async function*(
    branch,
    {
      options: {
        marker,
        children: [child],
      },
      emit,
    },
  ) {
    yield branch;
    yield* child(branch.clone());
  },
  {
    name: 'number',
    areOptionsValid: (options) => {
      if (options.children.length !== 1) {
        throw new Error(`'Optional' expression must have exactly 1 child.`);
      }
    },
  },
);
