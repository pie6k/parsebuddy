import { AnyObject } from '~/utils/types';
import {
  Parser,
  ParserOptions,
  createParserFactory,
  ParserFactoryOptions,
} from './factory';
// import { fork, literal } from '~/expressions';

interface CustomParserDefinitionCreator<Options, EmitType> {
  (
    options: ParserOptions<Options, any, any>,
    emit: (data: EmitType) => void,
  ): Parser<EmitType, any, any>;
}

export function defineParser<Options extends AnyObject, EmitType>(
  parserCreator: CustomParserDefinitionCreator<Options, EmitType>,
  options: ParserFactoryOptions<Options>,
) {
  return createParserFactory<Options, EmitType>(
    async function*(branch, { emit, options }) {
      const parser = parserCreator(options, emit);
      yield* parser(branch);
    },

    options,
  );
}
