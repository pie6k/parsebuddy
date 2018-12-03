import { createGrammar } from '~/base';
import { sequence, fork, literal } from '~/expressions';
import { getAllAsyncGeneratorResults } from './utils';

describe('createGrammarParser', () => {
  it('requires parser to be passed', () => {
    expect(() => {
      createGrammar({ parser: null });
    }).toThrowError();
  });

  it('compiles grammar and returns parsing function', () => {
    const grammar = createGrammar({
      parser: literal({ text: 'foo' }),
    });
    expect(grammar).toHaveProperty('parse');
    expect(typeof grammar.parse).toBe('function');
  });

  it('will not pass incorrect grammar input', async () => {
    const grammar = createGrammar({
      parser: literal({ text: 'foo' }),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('bar'));

    expect(results.length).toBe(0);
  });

  it('will pass matching grammar input', async () => {
    const grammar = createGrammar({
      parser: literal({ text: 'foo' }),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('foo'));

    expect(results.length).toBe(1);
  });

  it('will properly pass initialized data', async () => {
    const grammar = createGrammar<string, string>({
      dataHolder: {
        init: () => 'foo',
        clone: (foo) => foo,
      },
      parser: literal({ text: 'bar' }, (foo, bar) => `${foo}-${bar}`),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('bar'));

    expect(results[0].data).toBe('foo-bar');
  });

  it('will initialized to null when no initializator provided', async () => {
    const spy = jest.fn();
    const grammar = createGrammar<string, string>({
      parser: literal({ text: 'bar' }, spy),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('bar'));

    expect(spy).toBeCalledWith(null, 'bar');
  });

  it('will spread results for forked grammar', async () => {
    const grammar = createGrammar({
      parser: fork({
        children: [
          literal({ text: 'foo' }),
          literal({ text: 'bar' }),
          literal({ text: 'baz' }),
        ],
      }),
    });

    // expect(
    //   await getAllAsyncGeneratorResults(grammar.parse('foo')),
    // ).toHaveLength(1);
    expect(await getAllAsyncGeneratorResults(grammar.parse('ba'))).toHaveLength(
      2,
    );
    // expect(
    //   await getAllAsyncGeneratorResults(grammar.parse('bar')),
    // ).toHaveLength(1);
  });

  it('will emit data to result', async () => {
    const grammar = createGrammar<string, any>({
      parser: literal({ text: 'foo' }, (holder, data) => `${data}-${data}`),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('foo'));
    const [result] = results;

    expect(result.data).toBe('foo-foo');
  });

  it('will pass previous data to next parsers when returned', async () => {
    const grammar = createGrammar<string[], any>({
      dataHolder: {
        init: () => [],
        clone: (a) => [...a],
      },
      parser: sequence({
        children: [
          literal({ text: 'foo' }, (holder, data) => {
            holder.push(data);
          }), // pushing to reference - not returning
          literal({ text: 'bar' }, (holder, data) => [...holder, data]), // returning different reference
          literal({ text: 'baz' }, (holder, data) => [...holder, data]),
        ],
      }),
    });

    const results = await getAllAsyncGeneratorResults(
      grammar.parse('foobarbaz'),
    );
    const [result] = results;

    expect(result.data).toEqual(['foo', 'bar', 'baz']);
  });
});
