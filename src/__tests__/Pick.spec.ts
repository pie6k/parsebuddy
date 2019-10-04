import { pick, literal } from '..';
import {
  getParserResults,
  getParserResultsCount,
  getParserResultsMatched,
} from './utils';

const pickTest = pick({
  children: [
    literal({ text: 'foo' }),
    literal({ text: 'bar' }),
    literal({ text: 'baz' }),
  ],
});

const pickWithLimitTest = pick({
  limit: 2,
  children: [
    literal({ text: 'bar' }),
    literal({ text: 'baz' }),
    literal({ text: 'bac' }),
  ],
});

describe('pick parser', () => {
  test('will pass many items', async () => {
    expect(await getParserResultsMatched(pickTest, 'ba')).toHaveLength(10);
    expect(await getParserResultsMatched(pickTest, 'fo')).toHaveLength(5);
  });

  test('will respect limit', async () => {
    expect(await getParserResultsMatched(pickWithLimitTest, 'ba')).toHaveLength(
      2,
    );
    expect(
      await getParserResultsMatched(pickWithLimitTest, 'bar'),
    ).toHaveLength(2);
  });
});

const pickNestedTest = pick({
  children: [
    literal({ text: 'foo' }),
    literal({ text: 'bar' }),
    pick({
      children: [literal({ text: 'bac' }), literal({ text: 'bap' })],
    }),
  ],
});

describe('pick parser - nested', async () => {
  test('nested will pass many items', async () => {
    expect(await getParserResultsMatched(pickNestedTest, 'ba')).toEqual([
      'bar',
      'barfoo',
      'barfoobac',
      'barfoobacbap',
      'barfoobap',
      'barfoobapbac',
      'barbac',
      'barbacfoo',
      'barbacbap',
      'barbacbapfoo',
      'barbap',
      'barbapfoo',
      'barbapbac',
      'barbapbacfoo',
      'bac',
      'bacfoo',
      'bacfoobar',
      'bacbar',
      'bacbarfoo',
      'bacbap',
      'bacbapfoo',
      'bacbapfoobar',
      'bacbapbar',
      'bacbapbarfoo',
      'bap',
      'bapfoo',
      'bapfoobar',
      'bapbar',
      'bapbarfoo',
      'bapbac',
      'bapbacfoo',
      'bapbacfoobar',
      'bapbacbar',
      'bapbacbarfoo',
    ]);
  });
});

describe('pick parser - multiple', async () => {
  test('multiple will pass many items', async () => {
    const pickMultipleTest = pick({
      children: [
        literal({ text: 'foo' }),
        literal({ text: 'bar' }),
        literal({ text: 'baz' }),
        literal({ text: 'bac' }),
      ],
    });

    expect(
      await getParserResultsMatched(pickMultipleTest, 'foobarbaz'),
    ).toEqual(['foobarbaz', 'foobarbazbac']);
  });
});
