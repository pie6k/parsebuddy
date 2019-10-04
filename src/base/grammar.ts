import { ParsingBranch, Parser } from './parser';
import { getAllAsyncGeneratorResults } from '../utils/generators';

export interface GrammarDefinition {
  parser: Parser<any>;
}

export interface GrammarParseOptions {
  maxResults?: number;
  requireEntireInputToBeParsed?: boolean;
}

const defaultParseOptions: GrammarParseOptions = {
  maxResults: undefined,
  requireEntireInputToBeParsed: true,
};

function validateGrammarDefinition(definition: GrammarDefinition) {
  if (!definition.parser) {
    throw new Error('Parser is required for grammar');
  }
}

export function createGrammar(grammar: GrammarDefinition) {
  validateGrammarDefinition(grammar);
  const { parser } = grammar;

  async function* parse(input: string, options?: GrammarParseOptions) {
    options = { ...defaultParseOptions, ...options };

    const startBranch = new ParsingBranch({
      input,
    });
    for await (const resultBranch of parser(startBranch)) {
      // if some input has fullfilled all expressions and still have input - it's incorrect
      // eg if we want to parse color and input is 'blue and also I like cats' - it's incorrect input even tho 'blue' itself would match.
      if (options.requireEntireInputToBeParsed && resultBranch.hasMoreInput()) {
        continue;
      }

      const resultData = resultBranch.convertToResult();
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
