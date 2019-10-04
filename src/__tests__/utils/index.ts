import {
  Parser,
  ParsingBranch,
  createGrammar,
  GrammarParseOptions,
} from '../..';
import { getAllAsyncGeneratorResults } from '../../utils/generators';

export async function getParserResults<EmitType>(
  parser: Parser<EmitType>,
  input: string,
  options?: GrammarParseOptions,
) {
  const grammar = createGrammar({
    parser,
  });
  const results = await getAllAsyncGeneratorResults(
    grammar.parse(input, options),
  );

  return results;
}

export async function getParserResultsMatched<EmitType>(
  parser: Parser<EmitType>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  return results.map((result) => result.getMatchedInput());
}

export async function getParserResultsCount<EmitType>(
  parser: Parser<EmitType>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  return results.length;
}

export async function getParserFirstResult<EmitType, DataHolder, Marker>(
  parser: Parser<EmitType>,
  input: string,
  options?: GrammarParseOptions,
) {
  const results = await getParserResults(parser, input, options);

  if (!results.length) {
    return null;
  }

  return results[0];
}
