import { startsWith, isStringOneOf } from '~/utils/strings';
import { Parser } from '../factory';

export interface DataHolderConfig<DataHolder> {
  init: () => DataHolder;
  clone: (dataHolder: DataHolder) => DataHolder;
}

interface ParsingBranchOptions<DataHolder> {
  dataHolder?: DataHolderConfig<DataHolder>;
  input: string;
}

type ParsingBranchMatchType =
  | 'input'
  | 'suggestion'
  | 'fuzzy'
  | 'placeholder'
  | 'whitespace';

export interface ParsingBranchMatch<Marker> {
  content: string;
  type: ParsingBranchMatchType;
  marker: Marker;
}

export class ParsingBranch<DataHolder, Marker> {
  constructor(
    private readonly options: ParsingBranchOptions<DataHolder>,
    initialize = true,
  ) {
    if (!options) {
      throw new Error('ParsingBranch cannot be initialized without data');
    }
    if (typeof options.input !== 'string') {
      throw new Error('ParsingBranch input must be string');
    }

    if (initialize) {
      this.data = this.getNewDataHolder();
    }
  }

  private isFinishedFlag = false;
  private data: DataHolder;
  private scoreList: number[] = [];
  private matches: ParsingBranchMatch<Marker>[] = [];
  private parsersStack: Parser<any, DataHolder, Marker>[] = [];

  clone(): ParsingBranch<DataHolder, Marker> {
    const clone = new ParsingBranch<DataHolder, Marker>(this.options, false);
    clone.matches = [...this.matches];
    clone.scoreList = [...this.scoreList];
    clone.parsersStack = [...this.parsersStack];
    clone.setData(this.getDataHolderClone());

    return clone;
  }

  pushToParsersStack(parser: Parser<any, DataHolder, Marker>) {
    this.parsersStack.push(parser);
    return this;
  }

  popFromParsersStack() {
    this.parsersStack.pop();
    return this;
  }

  getCurrentParser() {
    return [...this.parsersStack].pop();
  }

  getParsersStackDescription() {
    return this.parsersStack.map((parser) => parser.name).join(' > ');
  }

  throwError(message: string) {
    throw new Error(
      `Parser error (${this.getParsersStackDescription()}): ${message}`,
    );
  }

  getNewDataHolder() {
    const { dataHolder } = this.options;
    if (!dataHolder) {
      return null;
    }

    return dataHolder.init();
  }

  getDataHolderClone() {
    const { dataHolder } = this.options;
    if (!dataHolder) {
      return null;
    }

    return dataHolder.clone(this.data);
  }

  setData(data: DataHolder) {
    this.data = data;
  }

  getMatches() {
    return this.matches;
  }

  getMatchedInput(includeFuzzy = false) {
    return this.getMatches()
      .filter((match) => {
        if (includeFuzzy) {
          return true;
        }
        return match.type !== 'fuzzy';
      }) // fuzy match is not part of the input as it's putted in between of real input - it should be ignored when getting remaining input because of that
      .map((match) => match.content)
      .join('');
  }

  markAsFinished() {
    this.isFinishedFlag = true;
    return this;
  }

  getInput() {
    const originalInput = this.getOriginalInput();
    const matchedInput = this.getMatchedInput();

    // we have no more input and we're generating suggestionsZ
    if (matchedInput.length > originalInput.length) {
      return '';
    }

    const originalAndMatchedParts = startsWith(originalInput, matchedInput);

    if (!originalAndMatchedParts) {
      console.log({ originalInput, matchedInput }, this);
      throw new Error('Parsing branch has incorrect input');
    }

    const [matched, remainingInput] = originalAndMatchedParts;

    return remainingInput;
  }

  hasMoreInput() {
    return !!this.getInput();
  }

  getOriginalInput() {
    return this.options.input;
  }

  getDataHolder() {
    return this.data;
  }

  getResult() {
    return {
      matched: this.getMatchedInput(true),
      matches: this.matches,
      data: this.data,
    };
  }

  isFinished() {
    if (this.isFinishedFlag) {
      return true;
    }
    return this.hasMatchOfType('placeholder');
  }

  hasMatches() {
    return this.getMatches().length > 0;
  }

  hasMatchOfType(type: ParsingBranchMatchType) {
    return this.getMatches().some((match) => match.type === type);
  }

  addMatch(match: ParsingBranchMatch<Marker>) {
    if (match.marker === undefined) {
      this.throwError(
        'marker cannot be undefined when adding match with .addMatch',
      );
    }
    this.validateNewMatch(match);
    this.matches = [...this.matches, match];
    return this;
  }

  addScore(score: number) {
    if (score <= 0 || score > 1) {
      this.throwError(
        'Score added to parsing branch must be greater than 0 and smaller than 1',
      );
    }
    this.scoreList = [...this.scoreList, score];
    return this;
  }

  getScore() {
    this.scoreList.reduce((finalScore, anotherPoint) => {
      return finalScore * anotherPoint;
    }, 1);
  }

  validateNewMatch(match: ParsingBranchMatch<Marker>) {
    const input = this.getInput();

    if (match.type !== 'placeholder' && match.content.length === 0) {
      this.throwError('Match content cannot be empty');
    }

    if (match.type === 'input' && this.hasMatchOfType('suggestion')) {
      this.throwError(
        `Match of type 'input' cannot be added when branch already have 'suggestion' matches`,
      );
    }

    const isInputStartingWithMatch = startsWith(input, match.content);

    // match of type 'input' must perfectly overlay start of remaining input
    if (match.type === 'input' && !isInputStartingWithMatch) {
      this.throwError(
        `Match added to parsing branch must match remaining input (input: '${input}', match: '${
          match.content
        }')`,
      );
    }
  }
}
