import { sequence, word } from '..';
import { getParserResults } from './utils';

describe('parser options', async () => {
  test('will skip disabled parsers', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({ text: 'bar', isEnabled: false }),
        word({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo baz')).toHaveLength(1);
  });

  test('will skip disabled parsers (using function option getter)', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({ text: 'bar', isEnabled: () => false }),
        word({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo baz')).toHaveLength(1);
  });
});
