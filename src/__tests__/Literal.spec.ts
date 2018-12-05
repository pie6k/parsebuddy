import { literal, sequence } from '~/expressions';
import {
  getParserResults,
  getParserResultsMatched,
  getParserFirstResultData,
  getParserFirstResult,
} from './utils';

describe('literal expression', () => {
  it('pass matching string', async () => {
    expect(
      await getParserResults(literal({ text: 'foo' }), 'foo'),
    ).toHaveLength(1);

    expect(
      await getParserResults(literal({ text: 'foo' }), 'bar'),
    ).toHaveLength(0);
  });

  it('pass empty string as suggestion', async () => {
    const [result] = await getParserResults(literal({ text: 'foo' }), '');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0].content).toBe('foo');
    expect(result.matches[0].type).toBe('suggestion');
  });

  it('to add proper suggestion', async () => {
    const results = await getParserResults(literal({ text: 'foo' }), 'fo');
    expect(results).toHaveLength(1);

    expect(results[0].matches).toHaveLength(2);
    expect(results[0].matches[1].type).toBe('suggestion');
  });

  it('to be case insensitive by default', async () => {
    const results = await getParserResults(literal({ text: 'Foo' }), 'foo');
    expect(results).toHaveLength(1);
  });

  it('to pass original case when case insensitive', async () => {
    const results = await getParserResults(literal({ text: 'FoO' }), 'fo');
    expect(results[0].matches[0].content).toBe('Fo');
    expect(results[0].matches[1].content).toBe('O');
  });

  it('to be case sensitive when required', async () => {
    const results = await getParserResults(
      literal({ text: 'Foo', isCaseSensitive: true }),
      'foo',
    );
    expect(results).toHaveLength(0);
  });

  it('will when requested ', async () => {
    const results = await getParserResults(
      literal({ text: 'Foo', isCaseSensitive: true }),
      'foo',
    );
    expect(results).toHaveLength(0);
  });
});

describe('literal expression - fuzzy mode', () => {
  const johnDoe = literal({ text: 'sir john doe', isFuzzy: true });
  it('will handle normal, not fuzzy input', async () => {
    expect(await getParserResults(johnDoe, 'sir john doe')).toHaveLength(1);
    expect(await getParserResults(johnDoe, 'sir')).toHaveLength(1);
    expect(await getParserResults(johnDoe, 'sir ')).toHaveLength(1);
    expect(await getParserResults(johnDoe, 'sir jo')).toHaveLength(1);
  });

  it('will pass fuzzy input', async () => {
    expect(await getParserResults(johnDoe, 'sirjohndoe')).toHaveLength(1);
    expect(await getParserResults(johnDoe, 'sjde')).toHaveLength(1);
    expect(await getParserResults(johnDoe, 'sirdoe')).toHaveLength(1);
  });

  it('will work with other not fuzzy parsers', async () => {
    const anotherParser = sequence({
      children: [literal({ text: 'my name is ' }), johnDoe],
    });
    expect(
      await getParserResultsMatched(anotherParser, 'my name is sir john doe'),
    ).toHaveLength(1);
    expect(
      await getParserResultsMatched(anotherParser, 'my name is sj de'),
    ).toHaveLength(1);
    expect(
      await getParserResultsMatched(anotherParser, 'my name sr de'),
    ).toHaveLength(0);
    expect(
      await getParserResultsMatched(anotherParser, 'my name is '),
    ).toHaveLength(1);
  });

  it('will generate proper matches for fuzzy', async () => {
    const anotherParser = sequence({
      children: [literal({ text: 'my name is ' }), johnDoe],
    });
    const [result] = await getParserResults(anotherParser, 'my name is sj de');

    const matches = result.matches;

    expect(matches).toEqual([
      { content: 'my name is ', type: 'input', marker: null },
      { content: 's', type: 'input', marker: null },
      { content: 'ir ', type: 'fuzzy', marker: null },
      { content: 'j', type: 'input', marker: null },
      { content: 'ohn', type: 'fuzzy', marker: null },
      { content: ' d', type: 'input', marker: null },
      { content: 'o', type: 'fuzzy', marker: null },
      { content: 'e', type: 'input', marker: null },
    ]);
  });

  it('will be case insensitive by default', async () => {
    expect(await getParserResultsMatched(johnDoe, 'Sir Doe')).toHaveLength(1);
    expect(await getParserResultsMatched(johnDoe, 'sir doe')).toHaveLength(1);
  });

  it('will be case insensitive when enabled', async () => {
    const johnDoeCaseSensitive = literal({
      text: 'sir john doe',
      isFuzzy: true,
      isCaseSensitive: true,
    });
    expect(
      await getParserResultsMatched(johnDoeCaseSensitive, 'Sir Doe'),
    ).toHaveLength(0);
    expect(
      await getParserResultsMatched(johnDoeCaseSensitive, 'sir doe'),
    ).toHaveLength(1);
  });

  it('will have higher score for less fuzzy results', async () => {
    const acurateResult = await getParserFirstResult(johnDoe, 'sir joh doe');
    const lessAcurateResult = await getParserFirstResult(johnDoe, 'sh do');
    expect(acurateResult.score).toBeGreaterThan(lessAcurateResult.score);
  });
});
