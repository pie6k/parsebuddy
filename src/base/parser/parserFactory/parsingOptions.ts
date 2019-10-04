export { ParsingBranch } from './ParsingBranch';

export interface ParsingOptions {
  dontParseWithoutInput?: boolean;
}

export const defaultParsingOptions: ParsingOptions = {
  dontParseWithoutInput: false,
};
