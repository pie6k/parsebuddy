import {
  ParsingBranch,
  setCurrentlyParsingBranch,
  clearCurrentlyParsingBranch,
  Marker,
} from './ParsingBranch';

import { ParsingOptions, defaultParsingOptions } from './parsingOptions';
import { AnyObject } from './services';

export interface Parser<EmitType> {
  (
    branch: ParsingBranch,
    parsingOptions?: ParsingOptions,
  ): AsyncIterableIterator<ParsingBranch>;
}

interface OptionsBase extends AnyObject {
  children?: never;
}

interface MatchCallbackData {
  matchesCount: number;
}

export interface ParsingRelatedParserOptions {
  children?: Array<Parser<any>>;
  marker?: Marker<any>;
  onMatch?: () => void;
}

export interface BuiltInParserOptions<Options> {
  id?: string;
  placeholder?: string;
  isEnabled?: boolean | ((options: Options) => boolean);
}

const defaultBaseParserData: Partial<ParsingRelatedParserOptions> = {
  marker: undefined,
};

export interface DataEmitHandler<EmitType> {
  (data: EmitType): void;
}

export interface ParserExecutorData<Options, EmitType> {
  options: ParserOptions<Options>;
  emit: (data: EmitType) => void;
}

interface ParserExecutor<Options, EmitType> {
  (
    branch: ParsingBranch,
    data: ParserExecutorData<Options, EmitType>,
  ): AsyncIterableIterator<ParsingBranch>;
}

export type ParserOptions<Options extends AnyObject> = Options &
  ParsingRelatedParserOptions &
  BuiltInParserOptions<Options>;

export interface ParserFactoryOptions<Options> {
  name: string;
  areOptionsValid?: (options: Options) => boolean | void;
  defaultOptions?: Partial<Options>;
}

function validateOptions<Options>(
  options: ParserOptions<Options>,
  factoryOptions: ParserFactoryOptions<ParserOptions<Options>>,
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
  factoryOptions: ParserFactoryOptions<ParserOptions<Options>>,
) {
  return function createParser(
    options?: ParserOptions<Options>,
    onEmit?: DataEmitHandler<EmitType>,
  ): Parser<EmitType> {
    // apply default options
    const fullOptions = Object.assign(
      {},
      defaultBaseParserData,
      factoryOptions.defaultOptions || {},
      options,
    );
    validateOptions(fullOptions, factoryOptions);

    async function* parser(
      branch: ParsingBranch,
      parsingOptions: ParsingOptions = {},
    ) {
      parsingOptions = { ...defaultParsingOptions, ...parsingOptions };
      if (branch.isFinished()) {
        return yield branch;
      }

      if (
        fullOptions.isEnabled === false ||
        (typeof fullOptions.isEnabled === 'function' &&
          !fullOptions.isEnabled(fullOptions))
      ) {
        return yield branch;
      }

      // if no more input and parser has placeholder
      if (fullOptions.placeholder && branch.shouldApplyPlaceholder()) {
        return yield branch
          .addMatch({
            type: 'placeholder',
            marker: fullOptions.marker,
            content: fullOptions.placeholder,
          })
          .markAsFinished();
      }

      if (!branch.hasMoreInput() && parsingOptions.dontParseWithoutInput) {
        return yield branch.markAsFinished();
      }

      const emit = (data: EmitType) => {
        if (!onEmit) return;
        const emitResult = onEmit(data);
      };

      branch.pushToParsersStack(parser);

      let matchesCount = 0;

      setCurrentlyParsingBranch(branch);

      for await (const newBranch of executor(branch, {
        emit,
        options: fullOptions,
      })) {
        matchesCount = matchesCount + 1;
        fullOptions.onMatch && fullOptions.onMatch();
        yield newBranch;
      }

      if (!matchesCount && fullOptions.placeholder && !branch.hasMoreInput()) {
        yield branch
          .addMatch({
            type: 'placeholder',
            marker: fullOptions.marker,
            content: fullOptions.placeholder,
          })
          .markAsFinished();
      }

      setCurrentlyParsingBranch(branch);
      branch.popFromParsersStack();
    }

    clearCurrentlyParsingBranch();

    // for debugging and error messages - overwrite parser function name
    Object.defineProperty(parser, 'name', {
      value: factoryOptions.name,
      writable: false,
    });

    return parser;
  };
}
