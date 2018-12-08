import { sequence, fork, literal, createGrammar } from '..';
import { getParserResults, getParserResultsCount } from './utils';

const color = fork({
  marker: 'color',
  children: [
    literal({ text: 'foo', marker: 'foo' }),
    literal({ text: 'bar', marker: 'bar' }),
  ],
});

const colorILike = sequence({
  children: [literal({ text: 'i like ' }), color],
});

describe('data emitting', () => {
  it('will properly connect data with branches', async () => {
    const parser = fork({
      children: [
        literal({ text: 'bar' }, (data) => data),
        literal({ text: 'baz' }, (data) => data),
      ],
    });
    const [resultBar, resultBaz] = await getParserResults(parser, 'ba');

    expect(resultBar.matched === resultBar.data).toBeTruthy();
    expect(resultBaz.matched === resultBaz.data).toBeTruthy();
  });

  it('will properly connect data with branches in nested scenario', async () => {
    const dataHandler = (data, holder) => {
      if (!holder) {
        return data;
      }
      return holder + data;
    };

    const parser = sequence({
      children: [
        literal({ text: 'a' }, dataHandler),
        fork({
          children: [
            literal({ text: 'b' }, dataHandler),
            literal({ text: 'c' }, dataHandler),
            fork({
              children: [
                literal({ text: 'd' }, dataHandler),
                literal({ text: 'e' }, dataHandler),
              ],
            }),
          ],
        }),
      ],
    });
    const results = await getParserResults(parser, 'a');

    for (let result of results) {
      expect(result.matched).toEqual(result.data);
    }
  });
});
