import { literal, sequence, number } from '~/expressions';
import { getParserResults } from './utils';
import { defineParser } from '~/base/parser';

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
});
