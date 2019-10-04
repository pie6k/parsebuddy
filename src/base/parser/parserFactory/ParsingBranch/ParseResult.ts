import { ParsedPart } from '.';
import { DataHolder } from './dataHolder';
import { Marker } from './marker';

interface InitData {
  input: string;
  inputableMatchedParts: ParsedPart[];
  matchedParts: ParsedPart[];
  matchedInput: string;
  score: number;
  dataMap: Map<DataHolder<any>, any>;
}

export class ParseResult {
  constructor(private data: InitData) {}

  getInput() {
    return this.data.input;
  }

  getMatchedInput() {
    return this.data.matchedInput;
  }

  getInputSuggestion() {
    return this.data.inputableMatchedParts
      .map((match) => match.content)
      .join('');
  }

  getScore() {
    return this.data.score;
  }

  getData<T>(dataHolderRef: DataHolder<T>) {
    const data = this.data.dataMap.get(dataHolderRef);

    return data as T | undefined;
  }

  getParts<M extends Marker>(markers: M[] = []): ParsedPart<M>[] {
    return this.data.matchedParts.map((match) => {
      const marker = match.marker;
      const isMarkerIncluded =
        !!match.marker && markers.includes(match.marker as M);

      const matchClone = { ...match };

      matchClone.marker = isMarkerIncluded ? marker : undefined;

      return matchClone;
    });
  }
}
