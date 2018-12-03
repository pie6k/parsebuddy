import { ParsingBranch } from './ParsingBranch';
export { ParsingBranch, DataHolderConfig } from './ParsingBranch';
import { AnyObject } from '~/utils/types';

export interface ParsingOptions {
  dontParseWithoutInput?: boolean;
}

export const defaultParsingOptions: ParsingOptions = {
  dontParseWithoutInput: false,
};
