import { getCurrentlyParsingBranch } from './index';

export interface Context<T> {
  set: (data: T) => void;
  get: () => T;
}

interface DataHolderConfig<T> {
  init: () => T;
}

export function createContext<T>(intialValue: T): Context<T> {
  function getBranchOrThrow() {
    const branch = getCurrentlyParsingBranch();

    if (!branch) {
      throw new Error(`Setting data to branch is only possible during parsing`);
    }

    return branch;
  }

  const contextRef: Context<T> = {
    set(data: T) {
      const branch = getBranchOrThrow();

      branch.setContext(contextRef, data);
    },
    get() {
      const branch = getBranchOrThrow();

      const value = branch.getContext(contextRef);

      if (value === undefined) {
        return intialValue;
      }

      return value;
    },
  };

  return contextRef;
}
