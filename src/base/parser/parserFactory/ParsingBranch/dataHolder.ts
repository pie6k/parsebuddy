import { getCurrentlyParsingBranch } from './index';

export interface DataHolder<T> {
  set: (data: DataHolderSetter<T>) => void;
}

export type DataHolderSetter<T> = T | ((oldData: T) => T);

function computeNewData<T>(oldData: T, dataSetter: DataHolderSetter<T>): T {
  if (typeof dataSetter === 'function') {
    return (dataSetter as (oldData: T) => T)(oldData);
  }

  return dataSetter;
}

export function createDataHolder<T>(): DataHolder<T> {
  function handleSetData(data: DataHolderSetter<T>) {
    const branch = getCurrentlyParsingBranch();

    if (!branch) {
      throw new Error(`Setting data to branch is only possible during parsing`);
    }
    const currentData = branch.getData(dataHolderRef);

    const newData = computeNewData(currentData, data);
    branch.setData<T>(dataHolderRef, newData);
  }

  const dataHolderRef: DataHolder<T> = {
    set(data: DataHolderSetter<T>) {
      handleSetData(data);
    },
  };

  return dataHolderRef;
}
