import { ParsingBranch } from './ParsingBranch';

import { ParsingOptions, defaultParsingOptions } from './parsingOptions';
import { AnyObject } from './services';

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

interface MatchCallbackData {
  matchesCount: number;
}

export interface ParsingRelatedParserOptions<DataHolder, Marker> {
  children?: Array<Parser<any, DataHolder, Marker>>;
  marker?: Marker;
  onMatch?: (
    brach: ParsingBranch<DataHolder, Marker>,
    data: MatchCallbackData,
  ) => void;
}

export interface BuiltInParserOptions<Options> {
  id?: string;
  placeholder?: string;
  isEnabled?: boolean | ((options: Options) => boolean);
}

const defaultBaseParserData: Partial<ParsingRelatedParserOptions<any, any>> = {
  marker: null,
};

export interface DataEmitHandler<EmitType, DataHolder> {
  (data: EmitType, dataHolder: DataHolder): DataHolder | void;
}

export interface ParserExecutorData<Options, EmitType> {
  options: ParserOptions<Options, any, any>;
  emit: (branch: ParsingBranch<any, any>, data: EmitType) => void;
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
> = Options &
  ParsingRelatedParserOptions<DataHolder, Marker> &
  BuiltInParserOptions<Options>;

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
    onEmit?: DataEmitHandler<EmitType, DataHolder>,
  ): Parser<EmitType, DataHolder, Marker> {
    // apply default options
    options = Object.assign(
      {},
      defaultBaseParserData,
      factoryOptions.defaultOptions || {},
      options,
    );
    validateOptions(options, factoryOptions);

    async function* parser(
      branch: ParsingBranch<DataHolder, Marker>,
      parsingOptions: ParsingOptions = {},
    ) {
      parsingOptions = { ...defaultParsingOptions, ...parsingOptions };
      if (branch.isFinished()) {
        return yield branch;
      }

      if (
        options.isEnabled === false ||
        (typeof options.isEnabled === 'function' && !options.isEnabled(options))
      ) {
        return yield branch;
      }

      // if no more input and parser has placeholder
      if (options.placeholder && branch.shouldApplyPlaceholder()) {
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

      const emit = (
        targetBranch: ParsingBranch<DataHolder, EmitType>,
        data: EmitType,
      ) => {
        if (!onEmit) return;
        const emitResult = onEmit(data, targetBranch.getDataHolder());
        if (emitResult !== undefined) {
          targetBranch.setData(emitResult as DataHolder);
        }
      };

      branch.pushToParsersStack(parser);

      let matchesCount = 0;

      for await (const newBranch of executor(branch, {
        emit,
        options: options,
      })) {
        matchesCount = matchesCount + 1;
        options.onMatch && options.onMatch(newBranch, { matchesCount });
        yield newBranch;
      }

      if (!matchesCount && options.placeholder && !branch.hasMoreInput()) {
        yield branch
          .addMatch({
            type: 'placeholder',
            marker: options.marker,
            content: options.placeholder,
          })
          .markAsFinished();
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
