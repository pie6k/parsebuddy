import { Parser } from '../factory';
import { getUniqueId } from './services';
import {
  createDataHolder,
  DataHolder,
  getDataHolderConfig,
} from './dataHolder';
import { Marker } from './marker';
export { Marker, createMarker } from './marker';
export { DataHolder, createDataHolder } from './dataHolder';
import { ParseResult } from './ParseResult';

import { startsWith } from '../../../../utils/strings';

interface ParsingBranchOptions {
  idPrefix?: string;
  input: string;
}

export type ParseMatchType =
  | 'input'
  | 'suggestion'
  | 'fuzzy'
  | 'placeholder'
  | 'whitespace';

export interface ParsedPart<M extends Marker = any> {
  content: string;
  type: ParseMatchType;
  marker?: M;
}

export interface ParsingBranchResult {
  suggestion: string;
  matched: string;
  matches: ParsedPart[];
  score: number;
  dataMap: Map<DataHolder<any>, any>;
}

let currentlyParsingBranch: ParsingBranch | null = null;

export function getCurrentlyParsingBranch() {
  return currentlyParsingBranch;
}

export function setCurrentlyParsingBranch(branch: ParsingBranch) {
  currentlyParsingBranch = branch;
}

export function clearCurrentlyParsingBranch() {
  currentlyParsingBranch = null;
}

export class ParsingBranch {
  private dataMap: Map<DataHolder<any>, any> = new Map();
  private markersMap: Map<Marker<any>, any[]> = new Map();
  constructor(private readonly options: ParsingBranchOptions) {
    const { input, idPrefix } = options;
    this.id = `${idPrefix ? `${idPrefix}-` : ''}${getUniqueId()}`;

    if (!options) {
      throw new Error('ParsingBranch cannot be initialized without data');
    }
    if (typeof input !== 'string') {
      throw new Error('ParsingBranch input must be string');
    }
  }
  private id: string;
  private isFinishedFlag = false;
  private scoreList: number[] = [];
  private matches: ParsedPart[] = [];
  private parsersStack: Parser<any>[] = [];
  private isBlocked = false;

  getId() {
    return this.id;
  }

  clone(): ParsingBranch {
    const clone = new ParsingBranch({
      ...this.options,
      idPrefix: this.getId(),
    });
    clone.matches = [...this.matches];
    clone.scoreList = [...this.scoreList];
    clone.parsersStack = [...this.parsersStack];

    this.dataMap.forEach((dataValue, dataHolderKind) => {
      const dataClone = getDataHolderConfig(dataHolderKind).clone(dataValue);

      clone.setData(dataHolderKind, dataClone);
    });

    return clone;
  }

  pushToParsersStack(parser: Parser<any>) {
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

  setData<T>(dataHolder: DataHolder<T>, data: T) {
    this.throwIfBlocked();
    this.dataMap.set(dataHolder, data);
    // this.data = data;
  }

  getData<T>(dataHolder: DataHolder<T>) {
    return this.dataMap.get(dataHolder) as T;
  }

  hasData() {
    return this.dataMap.size > 0;
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

  addMatch(match: ParsedPart) {
    this.throwIfBlocked();
    // if (match.marker === undefined) {
    //   this.throwError(
    //     'marker cannot be undefined when adding match with .addMatch',
    //   );
    // }
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

  convertToResult() {
    return new ParseResult({
      score: this.getScore(),
      input: this.getInput(),
      inputableMatchedParts: this.getInputableMatches(),
      dataMap: this.dataMap,
      matchedParts: this.matches,
      matchedInput: this.getMatchedInput(),
    });
  }

  validateNewMatch(match: ParsedPart) {
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
        `Match added to parsing branch must match remaining input (input: '${input}', match: '${match.content}')`,
      );
    }
  }
}
