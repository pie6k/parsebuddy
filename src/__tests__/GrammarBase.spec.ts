import { createGrammar, sequence, fork, literal } from '..';
import { getAllAsyncGeneratorResults } from '../utils/generators';
import { createDataHolder } from '../base';

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
    const testData = createDataHolder({ init: () => 'foo', clone: (d) => d });
    const grammar = createGrammar({
      parser: literal({ text: 'bar' }, (bar) =>
        testData.set((old) => old + bar),
      ),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('bar'));

    expect(results[0].getData(testData)).toBe('foobar');
  });

  it('will initialized to null when no initializator provided', async () => {
    const spy = jest.fn();
    const grammar = createGrammar({
      parser: literal({ text: 'bar' }, spy),
    });

    const results = await getAllAsyncGeneratorResults(grammar.parse('bar'));

    expect(spy).toBeCalledWith('bar');
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

  it('will pass previous data to next parsers when returned', async () => {
    const testData = createDataHolder({
      init: () => [] as string[],
      clone: (old) => [...old],
    });
    const grammar = createGrammar({
      parser: sequence({
        children: [
          literal({ text: 'foo' }, (data) =>
            testData.set((old) => [...old, data]),
          ), // pushing to reference - not returning
          literal({ text: 'bar' }, (data) =>
            testData.set((old) => [...old, data]),
          ), // returning different reference
          literal({ text: 'baz' }, (data) =>
            testData.set((old) => [...old, data]),
          ),
        ],
      }),
    });

    const results = await getAllAsyncGeneratorResults(
      grammar.parse('foobarbaz'),
    );
    const [result] = results;

    expect(result.getData(testData)).toEqual(['foo', 'bar', 'baz']);
  });
});
