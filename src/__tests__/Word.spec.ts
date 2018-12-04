// import repeat from './index';
import { literal, fork, repeat, sequence, word } from '~/expressions';
import {
  getParserResults,
  getParserResultsCount,
  getParserResultsMatched,
} from './utils';

const wordsSequence = sequence({
  children: [
    word({ text: 'foo' }),
    word({ text: 'bar' }),
    word({ text: 'baz' }),
  ],
});

describe('word parser', async () => {
  test('will parse sequence of words properly', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({ text: 'bar' }),
        word({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar ')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar b')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo ba')).toHaveLength(1);
    expect(await getParserResults(parser, 'fooba')).toHaveLength(0);
    expect(await getParserResults(parser, 'foobar baz')).toHaveLength(0);
  });
  test('will require whitespaces before and after other parsers', async () => {
    const parser = sequence({
      children: [
        literal({ text: 'foo' }),
        word({ text: 'bar' }),
        literal({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar ')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar b')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo bar')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo ba')).toHaveLength(1);
    expect(await getParserResults(parser, 'fooba')).toHaveLength(0);
    expect(await getParserResults(parser, 'foobar baz')).toHaveLength(0);
  });
  test('will handle ends of input properly', async () => {
    const parser = sequence({
      children: [word({ text: 'foo' })],
    });
    expect(await getParserResults(parser, 'fo')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo')).toHaveLength(1);
  });

  test('will handle custom word children', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({
          children: [
            fork({
              children: [literal({ text: 'a' }), literal({ text: 'b' })],
            }),
          ],
        }),
        literal({ text: 'bar' }),
      ],
    });
    expect(await getParserResults(parser, 'foo')).toHaveLength(2);
    expect(await getParserResults(parser, 'foo ')).toHaveLength(2);
    expect(await getParserResults(parser, 'fooa')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo a')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo a ')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo a bar')).toHaveLength(1);
    expect(await getParserResults(parser, 'foo a foo')).toHaveLength(0);
  });

  test('will properly handle nested words', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({
          children: [
            sequence({
              children: [
                word({ text: 'a' }),
                word({ text: 'b' }),
                word({ children: [word({ text: 'c' })] }),
              ],
            }),
          ],
        }),
        literal({ text: 'bar' }),
      ],
    });
    // expect(await getParserResults(parser, 'foo')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo ')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo  ')).toHaveLength(0);
    // expect(await getParserResults(parser, 'foo a')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo ab')).toHaveLength(0);
    // expect(await getParserResults(parser, 'foo a b')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo a bc')).toHaveLength(0);
    // expect(await getParserResults(parser, 'foo a b  c')).toHaveLength(0);
    // expect(await getParserResults(parser, 'foo a b c')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo a b cb')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo a b c b')).toHaveLength(1);
    // expect(await getParserResults(parser, 'foo a b c bar')).toHaveLength(1);
  });

  test('will not allow both text and children or none of them', async () => {
    expect(() => {
      word();
    }).toThrow();

    expect(() => {
      word({ text: 'foo', children: [literal({ text: 'foo' })] });
    }).toThrow();
  });
});
