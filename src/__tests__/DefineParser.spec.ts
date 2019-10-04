import { defineParser, literal, sequence, number, fork, repeat } from '..';
import { getParserResults } from './utils';
import { createDataHolder } from '../base';

interface PriceOptions {
  currency: 'usd' | 'eur';
}

const price = defineParser<PriceOptions, number>(
  function({ currency }, emit) {
    return sequence({
      children: [
        number({ max: 100, min: 0 }, (data) => emit(data)),
        literal({ text: currency }),
      ],
    });
  },
  { name: 'city' },
);

describe('custom parsers', () => {
  it('custom parsers is able to parse input', async () => {
    expect(
      await getParserResults(price({ currency: 'usd' }), '50usd'),
    ).toHaveLength(1);
  });

  it('custom parsers is properly emiting data', async () => {
    const stringDataHolder = createDataHolder({
      init: () => {
        return '';
      },
      clone: (data) => {
        return data;
      },
    });
    const customParser = defineParser<{}, string>(
      function(options, emit) {
        return fork({
          children: [
            literal({ text: 'bar' }, emit),
            literal({ text: 'baz' }, emit),
          ],
        });
      },
      { name: 'customParser' },
    );

    const dataCallback = (data: string) => {
      stringDataHolder.set((oldData) => {
        return oldData + data;
      });
    };

    const parser = sequence({
      children: [
        customParser({}, dataCallback),
        fork({
          children: [
            literal({ text: '1' }, dataCallback),
            literal({ text: '2' }, dataCallback),
          ],
        }),
      ],
    });
    const results = await getParserResults(parser, 'bar');

    expect(
      (await getParserResults(parser, 'bar1'))[0].getData(stringDataHolder),
    ).toEqual('bar1');
    expect(
      (await getParserResults(parser, 'bar2'))[0].getData(stringDataHolder),
    ).toEqual('bar2');
  });

  it('handles properly more advanced custom parser', async () => {
    interface FruitsListData {
      fruitsCount: number;
    }

    const fruitsCountDataHolder = createDataHolder({
      init: () => 0,
      clone: (data) => data,
    });

    const fruitsList = defineParser<{}, FruitsListData>(
      function(options, emit) {
        let count = 0;
        return repeat({
          glue: ' and ',
          limit: 3,
          onMatch: () => {
            emit({ fruitsCount: count });
          },
          children: [
            fork({
              // marker: 'fruit',
              onMatch: () => {
                fruitsCountDataHolder.set((count) => count + 1);
              },
              children: [
                literal({ text: 'banana' }),
                literal({ text: 'apple' }),
                literal({ text: 'orange' }),
              ],
            }),
          ],
        });
      },
      { name: 'fruitsList' },
    );

    const parser = sequence({
      children: [literal({ text: 'i have ' }), fruitsList({}, (data) => data)],
    });

    const results = await getParserResults(
      parser,
      'i have banana and apple and orange',
    );

    expect(results).toHaveLength(1);
    expect(results[0].getData(fruitsCountDataHolder)).toEqual(3);

    const resultsShort = await getParserResults(
      parser,
      'i have banana and app',
    );

    expect(resultsShort).toHaveLength(1);
    expect(resultsShort[0].getData(fruitsCountDataHolder)).toEqual(2);
  });
});
