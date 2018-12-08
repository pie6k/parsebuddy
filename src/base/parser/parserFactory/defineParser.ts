import {
  Parser,
  ParserOptions,
  createParserFactory,
  ParserFactoryOptions,
} from './factory';
import { ParsingBranch } from './ParsingBranch';
import { AnyObject } from './services';

type Resolvable<Type> = Type | Promise<Type>;

interface CustomParserDefinitionCreator<Options, EmitType> {
  (
    options: ParserOptions<Options, any, any>,
    emit: (data: EmitType) => void,
  ): Resolvable<Parser<EmitType, any, any>>;
}

export function defineParser<Options extends AnyObject, EmitType>(
  parserCreator: CustomParserDefinitionCreator<Options, EmitType>,
  options: ParserFactoryOptions<Options>,
) {
  return createParserFactory<Options, EmitType>(async function*(
    branch,
    { emit, options },
  ) {
    /**
     * During parsing of custom parser - keep track of every piece of data emiited with it's callback for each branch
     */
    let emitBuffer: EmitType[] = [];
    const emiter = (data: EmitType) => {
      emitBuffer.push(data);
    };

    // using custom emitter - create parser

    const parser = await parserCreator(options, emiter);

    // now wait for each new branch, then emit all accumulated data to it and clear the emit data buffer, then yield it normally to continue parsing it
    for await (const resultBranch of parser(branch)) {
      for (let emittedData of emitBuffer) {
        // use default parser factory emit callback that will handle everything
        emit(resultBranch, emittedData);
      }

      // clear the buffer before next possible branch will be generated
      emitBuffer = [];

      yield resultBranch;
    }
  },
  options);
}
