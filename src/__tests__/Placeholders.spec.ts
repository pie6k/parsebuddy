import { createGrammar, sequence, fork, literal } from '..';
import { getParserResults, getParserResultsCount } from './utils';

async function getAllAsyncGeneratorResults<T>(
  generator: AsyncIterableIterator<T>,
) {
  const results: T[] = [];
  for await (const result of generator) {
    results.push(result);
  }
  return results;
}

describe('placeholders', () => {
  it('will not execute children when parent has placeholder and there is no more content', async () => {
    const results = await getParserResults(
      fork({
        placeholder: 'foo bar or baz',
        children: [
          literal({ text: 'foo' }),
          literal({ text: 'bar' }),
          literal({ text: 'baz' }),
        ],
      }),
      '',
    );

    expect(results).toHaveLength(1);
    expect(results[0].getParts()).toHaveLength(1);
    expect(results[0].getParts()[0]).toHaveProperty('type', 'placeholder');
    expect(results[0].getParts()[0]).toHaveProperty(
      'content',
      'foo bar or baz',
    );
  });

  it('will add placeholders when there is no input and placeholder prop is set', async () => {
    const results = await getParserResults(
      fork({
        children: [
          literal({ text: 'foo', placeholder: 'a' }),
          literal({ text: 'bar', placeholder: 'b' }),
          literal({ text: 'baz', placeholder: 'c' }),
        ],
      }),
      '',
    );

    expect(results.length).toBe(3);
    expect(
      results.map((result) => {
        return result.getParts()[0].content;
      }),
    ).toEqual(['a', 'b', 'c']);
    expect(
      results.every((result) => {
        return result.getParts()[0].type === 'placeholder';
      }),
    ).toBe(true);
  });

  it('will only add placeholder once per branch', async () => {
    const results = await getParserResults(
      sequence({
        children: [
          literal({ text: 'foo', placeholder: 'a' }),
          literal({ text: 'bar', placeholder: 'b' }),
        ],
      }),
      '',
    );

    expect(results.length).toBe(1);
    expect(results[0].getParts().length).toBe(1);
  });
});
