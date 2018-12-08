import { startsWith, isStringOneOf } from '~/utils/strings';
import { Parser } from '../factory';
import { getUniqueId } from './services';

export interface DataHolderConfig<DataHolder> {
  init: () => DataHolder;
  clone: (dataHolder: DataHolder) => DataHolder;
}

interface ParsingBranchOptions<DataHolder> {
  dataHolder?: DataHolderConfig<DataHolder>;
  idPrefix?: string;
  input: string;
}

export type ParseMatchType =
  | 'input'
  | 'suggestion'
  | 'fuzzy'
  | 'placeholder'
  | 'whitespace';

export interface ParsingBranchMatch<Marker> {
  content: string;
  type: ParseMatchType;
  marker: Marker;
}

export interface ParsingBranchResult<DataHolder, Marker> {
  suggestion: string;
  matched: string;
  matches: ParsingBranchMatch<Marker>[];
  score: number;
  data: DataHolder;
}

export class ParsingBranch<DataHolder, Marker> {
  constructor(
    private readonly options: ParsingBranchOptions<DataHolder>,
    initialize = true,
  ) {
    const { input, idPrefix } = options;
    this.id = `${idPrefix ? `${idPrefix}-` : ''}${getUniqueId()}`;

    if (!options) {
      throw new Error('ParsingBranch cannot be initialized without data');
    }
    if (typeof input !== 'string') {
      throw new Error('ParsingBranch input must be string');
    }

    if (initialize) {
      this.data = this.getNewDataHolder();
    }
  }
  private id: string;
  private isFinishedFlag = false;
  private data: DataHolder;
  private scoreList: number[] = [];
  private matches: ParsingBranchMatch<Marker>[] = [];
  private parsersStack: Parser<any, DataHolder, Marker>[] = [];
  private isBlocked = false;

  getId() {
    return this.id;
  }

  clone(): ParsingBranch<DataHolder, Marker> {
    const clone = new ParsingBranch<DataHolder, Marker>(
      { ...this.options, idPrefix: this.getId() },
      false,
    );
    clone.matches = [...this.matches];
    clone.scoreList = [...this.scoreList];
    clone.parsersStack = [...this.parsersStack];
    clone.setData(this.getDataHolderClone());

    // this.isBlocked = true;

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

  throwIfBlocked() {
    if (this.isBlocked) {
      this.throwError(
        'This branch is blocked and any modification is not allowed anymore',
      );
    }
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
    if (this.hasData() && !dataHolder) {
      this.throwError(
        'Branch needs instruction about how to clone branch dataholder',
      );
    }

    if (!dataHolder) {
      return null;
    }

    return dataHolder.clone(this.data);
  }

  setData(data: DataHolder) {
    this.throwIfBlocked();
    this.data = data;
  }

  hasData() {
    return this.data !== null;
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
    this.throwIfBlocked();
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
      throw new Error('Parsing branch has incorrect input');
    }

    const [matched, remainingInput] = originalAndMatchedParts;

    return remainingInput;
  }

  hasOnlyInput() {
    return this.getMatches().every((match) => match.type === 'input');
  }

  hasMoreInput() {
    return !!this.getInput();
  }

  shouldApplyPlaceholder() {
    if (!this.getOriginalInput()) {
      return true;
    }
    if (!this.hasMoreInput()) {
      return !this.hasOnlyInput();
    }

    return false;
  }

  getOriginalInput() {
    return this.options.input;
  }

  getDataHolder() {
    return this.data;
  }

  getInputableMatches() {
    let hasNoInputable = false;
    return this.getMatches().filter((match) => {
      if (hasNoInputable) {
        return false;
      }
      const isMatchInputable =
        match.type === 'input' ||
        match.type === 'fuzzy' ||
        match.type === 'suggestion';
      if (!isMatchInputable) {
        hasNoInputable = true;
      }

      return isMatchInputable;
    });
  }

  getFullSuggestion() {
    return this.getInputableMatches()
      .map((match) => match.content)
      .join('');
  }

  getResult(): ParsingBranchResult<DataHolder, Marker> {
    return {
      suggestion: this.getFullSuggestion(),
      matched: this.getMatchedInput(true),
      matches: this.matches,
      score: this.getScore(),
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

  hasMatchOfType(type: ParseMatchType) {
    return this.getMatches().some((match) => match.type === type);
  }

  addMatch(match: ParsingBranchMatch<Marker>) {
    this.throwIfBlocked();
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
    this.throwIfBlocked();
    if (score <= 0 || score > 1) {
      this.throwError(
        'Score added to parsing branch must be greater than 0 and smaller than 1',
      );
    }
    this.scoreList = [...this.scoreList, score];
    return this;
  }

  getScore() {
    return this.scoreList.reduce((finalScore, anotherPoint) => {
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
