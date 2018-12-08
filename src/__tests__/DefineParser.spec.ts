import { defineParser, literal, sequence, number, fork, repeat } from '..';
import { getParserResults } from './utils';

interface PriceOptions {
  currency: 'usd' | 'eur';
}

const price = defineParser<PriceOptions, number>(
  function({ currency }, emit) {
    return sequence({
      children: [
        number({ ignoreNegative: true, max: 100 }, (data) => emit(data)),
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
    const customParser = defineParser<{}, string>(
      function(options, emit) {
        return fork({
          children: [
            literal({ text: 'bar' }, (data) => {
              emit(data);
            }),
            literal({ text: 'baz' }, (data) => {
              emit(data);
            }),
          ],
        });
      },
      { name: 'customParser' },
    );

    const dataCallback = (data: string, holder: string) => {
      if (holder === null) {
        return data;
      }
      return holder + data;
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
    const results = await getParserResults(parser, 'ba');

    expect(results).toHaveLength(4);

    for (let result of results) {
      expect(result.data).toEqual(result.matched);
    }
  });

  it('handles properly more advanced custom parser', async () => {
    interface FruitsListData {
      fruitsCount: number;
    }

    const fruitsList = defineParser<{}, FruitsListData>(
      function(options, emit) {
        let count = 0;
        return repeat({
          glue: ' and ',
          limit: 3,
          onMatch: (a) => {
            emit({ fruitsCount: count });
          },
          children: [
            fork({
              // marker: 'fruit',
              onMatch: (branch) => {
                count++;
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
    expect(results[0].data).toEqual({ fruitsCount: 3 });

    const resultsShort = await getParserResults(
      parser,
      'i have banana and app',
    );

    expect(resultsShort).toHaveLength(1);
    expect(resultsShort[0].data).toEqual({ fruitsCount: 2 });
  });
});
