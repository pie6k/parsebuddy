import { getCurrentlyParsingBranch } from './index';

export interface Marker<T extends string = string> {
  readonly name: T;
}

export function createMarker<T extends string>(name: T): Marker<T> {
  return {
    get name() {
      return name;
    },
  };
}
