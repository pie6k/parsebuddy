import { literal } from '~/expressions';
import { getParserResults } from './utils';

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
