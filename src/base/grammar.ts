import {
  ParsingBranch,
  createParserFactory,
  DataHolderConfig,
  Parser,
} from './parser';
import { getAllAsyncGeneratorResults } from '~/utils/generators';

export interface GrammarDefinition<DataHolder, Marker> {
  parser: Parser<any, DataHolder, Marker>;
  dataHolder?: DataHolderConfig<DataHolder>;
}

export interface GrammarParseOptions {
  maxResults?: number;
  requireEntireInputToBeParsed?: boolean;
}

const defaultParseOptions: GrammarParseOptions = {
  maxResults: null,
  requireEntireInputToBeParsed: true,
};

function validateGrammarDefinition<DataHolder, Marker>(
  definition: GrammarDefinition<DataHolder, Marker>,
) {
  if (!definition.parser) {
    throw new Error('Parser is required for grammar');
  }
}

export function createGrammar<DataHolder, Marker>(
  grammar: GrammarDefinition<DataHolder, Marker>,
) {
  validateGrammarDefinition(grammar);
  const { dataHolder, parser } = grammar;

  async function* parse(input: string, options?: GrammarParseOptions) {
    options = { ...defaultParseOptions, ...options };

    const startBranch = new ParsingBranch<DataHolder, Marker>({
      dataHolder,
      input,
    });
    for await (const resultBranch of parser(startBranch)) {
      // if some input has fullfilled all expressions and still have input - it's incorrect
      // eg if we want to parse color and input is 'blue and also I like cats' - it's incorrect input even tho 'blue' itself would match.
      if (options.requireEntireInputToBeParsed && resultBranch.hasMoreInput()) {
        continue;
      }

      const resultData = resultBranch.getResult();
      yield resultData;
    }
  }

  async function parseAll(input: string, options?: GrammarParseOptions) {
    return await getAllAsyncGeneratorResults(parse(input, options));
  }

  return {
    parse,
    parseAll,
  };
}
