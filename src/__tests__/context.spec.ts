import { sequence, word, defineParser, createContext } from '..';
import { getParserResults } from './utils';
import { createMarker } from '../base';

const colorContext = createContext('red');
const countContext = createContext(0);

describe('parser context', () => {
  test('will use initial context value', async () => {
    const foo = defineParser(
      function(options, emit) {
        const color = colorContext.get();
        return word({ text: color });
      },
      { name: 'foo' },
    );

    expect(await getParserResults(foo(), 'red')).toHaveLength(1);
  });

  test('will use changed value in other parsers', async () => {
    const nextNumber = defineParser(
      function(options, emit) {
        const num = countContext.get();
        countContext.set(num + 1);
        return word({ text: `${num}` });
      },
      { name: 'nextNumber' },
    );

    const parser = sequence({
      children: [
        nextNumber(),
        nextNumber(),
        nextNumber(),
        sequence({
          children: [nextNumber(), nextNumber()],
        }),
      ],
    });

    expect(await getParserResults(parser, '0 1 2 3 4')).toHaveLength(1);
    expect(await getParserResults(parser, '0 1 2 3 4')).toHaveLength(1);
  });
});
