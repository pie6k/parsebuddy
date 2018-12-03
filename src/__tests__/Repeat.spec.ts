// import repeat from './index';
import { literal, fork, repeat } from '~/expressions';
import {
  getParserResults,
  getParserResultsCount,
  getParserResultsMatched,
} from './utils';

const repeatTest = repeat({
  glue: ' and ',
  children: [
    fork({
      children: [
        literal({ text: 'foo' }),
        literal({ text: 'bar' }),
        literal({ text: 'baz' }),
      ],
    }),
  ],
});

describe('repeat parser', async () => {
  test('will not allow multiple children', async () => {
    expect(() =>
      repeat({
        glue: ' and ',
        children: [literal({ text: 'foo' }), literal({ text: 'foo' })],
      }),
    ).toThrow();

    expect(() =>
      repeat({ glue: ' and ', children: [literal({ text: 'foo' })] }),
    ).not.toThrow();
  });

  test('will not allow too big repeat count limit', async () => {
    expect(() =>
      repeat({
        glue: ' and ',
        limit: 10,
        children: [literal({ text: 'foo' })],
      }),
    ).toThrow();
    expect(() =>
      repeat({
        glue: ' and ',
        limit: 4,
        children: [literal({ text: 'foo' })],
      }),
    ).not.toThrow();
  });

  it('will suggest only subject without glue when dont have it fully matched', async () => {
    const results = await getParserResultsMatched(repeatTest, 'fo');

    expect(results).toEqual(['foo']);
  });

  it('will suggest glue when have first subject matching', async () => {
    const results = await getParserResultsMatched(repeatTest, 'foo');

    expect(results).toEqual(['foo', 'foo and ']);
  });

  it('will suggest next repeat possibilities when have glue', async () => {
    const results = await getParserResultsMatched(repeatTest, 'foo and ');

    expect(results).toEqual(['foo and foo', 'foo and bar', 'foo and baz']);
  });

  it('will respect limit', async () => {
    const repeatTestWithLimit = repeat({
      glue: ' and ',
      limit: 2,
      children: [literal({ text: 'foo' })],
    });

    expect(
      await getParserResultsCount(repeatTestWithLimit, 'foo and foo'),
    ).toBe(1);
    expect(
      await getParserResultsCount(repeatTestWithLimit, 'foo and foo and foo'),
    ).toBe(0);
  });

  it('will respect custom glue', async () => {
    const repeatTestWithLimit = repeat({
      glue: [' & '],
      children: [literal({ text: 'foo' })],
    });

    expect(
      await getParserResults(repeatTestWithLimit, 'foo and foo'),
    ).toHaveLength(0);
    expect(
      await getParserResultsMatched(repeatTestWithLimit, 'foo & foo'),
    ).toEqual(['foo & foo', 'foo & foo & ']);
  });

  // TODO: Unique case
});
