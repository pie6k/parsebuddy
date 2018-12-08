import { Parser, ParsingBranch } from '~/base/parser';
import { createGrammar } from '~/base';
import { GrammarParseOptions } from '~/base/grammar';
import { getAllAsyncGeneratorResults } from '~/utils/generators';

export async function getParserResults<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType, DataHolder, Marker>,
  input: string,
  options?: GrammarParseOptions,
) {
  const grammar = createGrammar({
    parser,
    dataHolder: {
      init: () => null,
      clone: (data) => data,
    },
  });
  const results = await getAllAsyncGeneratorResults(
    grammar.parse(input, options),
  );

  return results;
}

export async function getParserResultsMatched<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType, DataHolder, Marker>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  return results.map((result) => result.matched);
}

export async function getParserResultsCount<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType, DataHolder, Marker>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  return results.length;
}

export async function getParserFirstResult<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType, DataHolder, Marker>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  if (!results.length) {
    return null;
  }

  return results[0];
}

export async function getParserFirstResultData<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType, DataHolder, Marker>,
  input: string,
  options?: GrammarParseOptions,
) {
  const result = await getParserFirstResult(parser, input, options);

  if (!result) {
    return null;
  }

  return result.data;
}
