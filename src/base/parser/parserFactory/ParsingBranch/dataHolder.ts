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

interface DataHolderConfig<T> {
  init: () => T;
  clone: (old: T) => T;
}

const dataHolderConfigMap = new Map<DataHolder<any>, DataHolderConfig<any>>();

export function getDataHolderConfig<T>(dataHolder: DataHolder<T>) {
  return dataHolderConfigMap.get(dataHolder) as DataHolderConfig<T>;
}

export function createDataHolder<T>(
  config: DataHolderConfig<T>,
): DataHolder<T> {
  function handleSetData(dataRecipe: DataHolderSetter<T>) {
    const branch = getCurrentlyParsingBranch();

    if (!branch) {
      throw new Error(`Setting data to branch is only possible during parsing`);
    }
    let currentData = branch.getData(dataHolderRef);

    if (currentData === undefined) {
      currentData = config.init();
    }

    const newData = computeNewData(currentData, dataRecipe);

    branch.setData<T>(dataHolderRef, newData);
  }

  const dataHolderRef: DataHolder<T> = {
    set(data: DataHolderSetter<T>) {
      handleSetData(data);
    },
  };

  dataHolderConfigMap.set(dataHolderRef, config);

  return dataHolderRef;
}
