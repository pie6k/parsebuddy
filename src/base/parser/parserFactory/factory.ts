import { ParsingBranch } from './ParsingBranch';
export { ParsingBranch, DataHolderConfig } from './ParsingBranch';
import { AnyObject } from '~/utils/types';

import { ParsingOptions, defaultParsingOptions } from './parsingOptions';

interface ParserData<Options, EmitType> {
  options: Options;
  emit: (data: EmitType) => void;
}

export interface Parser<EmitType, DataHolder, Marker> {
  (
    branch: ParsingBranch<DataHolder, Marker>,
    parsingOptions?: ParsingOptions,
  ): AsyncIterableIterator<ParsingBranch<DataHolder, Marker>>;
}

interface OptionsBase extends AnyObject {
  children?: never;
}

export interface ChildrenData<DataHolder, Marker> {
  children?: Array<Parser<any, DataHolder, Marker>>;
  placeholder?: string;
  marker?: Marker;
}

export interface DataEmitHandler<DataHolder, EmitType> {
  (dataHolder: DataHolder, data: EmitType): DataHolder | void;
}

interface ParserExecutorData<Options, EmitType> {
  options: ParserOptions<Options, any, any>;
  emit: (data: EmitType) => void;
}

interface ParserExecutor<Options, EmitType> {
  (
    branch: ParsingBranch<any, any>,
    data: ParserExecutorData<Options, EmitType>,
  ): AsyncIterableIterator<ParsingBranch<any, any>>;
}

export type ParserOptions<
  Options extends AnyObject,
  DataHolder,
  Marker
> = Options & ChildrenData<DataHolder, Marker>;

export interface ParserFactoryOptions<Options> {
  name: string;
  areOptionsValid?: (options: Options) => boolean | void;
  defaultOptions?: Partial<Options>;
}

function validateOptions<Options, DataHolder, Marker>(
  options: ParserOptions<Options, DataHolder, Marker>,
  factoryOptions: ParserFactoryOptions<
    ParserOptions<Options, DataHolder, Marker>
  >,
) {
  if (
    factoryOptions.areOptionsValid &&
    factoryOptions.areOptionsValid(options) === false
  ) {
    throw new Error('Options passed to parser didnt pass validation');
  }
}

export function createParserFactory<Options extends OptionsBase, EmitType>(
  executor: ParserExecutor<Options, EmitType>,
  factoryOptions: ParserFactoryOptions<ParserOptions<Options, any, any>>,
) {
  return function createParser<DataHolder, Marker>(
    options?: ParserOptions<Options, DataHolder, Marker>,
    onEmit?: DataEmitHandler<DataHolder, EmitType>,
  ): Parser<EmitType, DataHolder, Marker> {
    // apply default options
    options = Object.assign({}, factoryOptions.defaultOptions || {}, options);
    validateOptions(options, factoryOptions);

    async function* parser(
      branch: ParsingBranch<DataHolder, Marker>,
      parsingOptions: ParsingOptions = {},
    ) {
      parsingOptions = { ...defaultParsingOptions, ...parsingOptions };
      if (branch.isFinished()) {
        return yield branch;
      }

      // if no more input and parser has placeholder
      if (!branch.hasMoreInput() && options.placeholder) {
        return yield branch
          .addMatch({
            type: 'placeholder',
            marker: options.marker,
            content: options.placeholder,
          })
          .markAsFinished();
      }

      if (!branch.hasMoreInput() && parsingOptions.dontParseWithoutInput) {
        return yield branch.markAsFinished();
      }

      const emit = (data: EmitType) => {
        if (!onEmit) return;
        const emitResult = onEmit(branch.getDataHolder(), data);
        if (emitResult !== undefined) {
          branch.setData(emitResult as DataHolder);
        }
      };

      branch.pushToParsersStack(parser);

      for await (const newBranch of executor(branch, {
        emit,
        options: options,
      })) {
        yield newBranch;
      }

      branch.popFromParsersStack();
    }

    // for debugging and error messages - overwrite parser function name
    Object.defineProperty(parser, 'name', {
      value: factoryOptions.name,
      writable: false,
    });

    return parser;
  };
}
