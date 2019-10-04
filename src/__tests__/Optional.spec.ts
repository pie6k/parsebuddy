import { createGrammar, sequence, fork, literal, optional } from '..';
import {
  getParserResults,
  getParserResultsCount,
  getParserResultsMatched,
} from './utils';

describe('optional', () => {
  it('will pass child and allow to skip it', async () => {
    const parser = sequence({
      children: [
        literal({ text: 'foo' }),
        optional({ children: [literal({ text: 'bar' })] }),
        literal({ text: 'baz' }),
      ],
    });

    expect(await getParserResultsMatched(parser, 'foo')).toEqual([
      'foobaz',
      'foobarbaz',
    ]);

    expect(await getParserResultsMatched(parser, 'fo')).toEqual([
      'foobaz',
      'foobarbaz',
    ]);

    expect(await getParserResultsMatched(parser, 'fooba')).toEqual([
      'foobaz',
      'foobarbaz',
    ]);
  });
});
