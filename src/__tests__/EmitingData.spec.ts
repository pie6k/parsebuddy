import { sequence, fork, literal, createDataHolder } from '..';
import { getParserResults } from './utils';

const stringDataHolder = createDataHolder({
  init: () => '',
  clone: (data) => data,
});

describe('data emitting', () => {
  it('will properly connect data with branches', async () => {
    const parser = fork({
      children: [
        literal({ text: 'bar' }, (data) => {
          stringDataHolder.set(data);
        }),
        literal({ text: 'baz' }, (data) => {
          stringDataHolder.set(data);
        }),
      ],
    });
    const [resultBar, resultBaz] = await getParserResults(parser, 'ba');

    expect(resultBar.getData(stringDataHolder)! === 'bar').toBeTruthy();
    expect(resultBaz.getData(stringDataHolder)! === 'baz').toBeTruthy();
  });

  it('will properly connect data with branches in nested scenario', async () => {
    const dataHandler = (data: string) => {
      stringDataHolder.set((current) => current + data);
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
    const results = await getParserResults(parser, 'ace');

    for (let result of results) {
      expect(result.getMatchedInput()).toEqual(
        result.getData(stringDataHolder),
      );
    }
  });
});
