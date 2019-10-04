import { sequence, word } from '..';
import { getParserResults } from './utils';
import { createMarker } from '../base';

describe('parser options', () => {
  test('will skip disabled parsers', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({ text: 'bar', isEnabled: false }),
        word({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo baz')).toHaveLength(1);
  });

  test('will skip disabled parsers (using function option getter)', async () => {
    const parser = sequence({
      children: [
        word({ text: 'foo' }),
        word({ text: 'bar', isEnabled: () => false }),
        word({ text: 'baz' }),
      ],
    });
    expect(await getParserResults(parser, 'foo bar baz')).toHaveLength(0);
    expect(await getParserResults(parser, 'foo baz')).toHaveLength(1);
  });

  test('will properly create markers', async () => {
    const fooMarker = createMarker('foo-marker');
    const bazMarker = createMarker('baz-marker');

    const parser = sequence({
      children: [
        word({ text: 'foo', marker: fooMarker }),
        word({ text: 'bar' }),
        word({ text: 'baz', marker: bazMarker }),
      ],
    });
    const results = await getParserResults(parser, 'foo bar baz');

    expect(results).toHaveLength(1);

    const [result] = results;

    const parts = result.getParts([fooMarker, bazMarker]);

    expect(parts.find((part) => part.content === 'foo').marker.name).toEqual(
      'foo-marker',
    );
    expect(parts.find((part) => part.content === 'baz').marker.name).toEqual(
      'baz-marker',
    );
    expect(parts.find((part) => part.content === 'bar').marker).toEqual(
      undefined,
    );
  });

  test('will skip marker if its not listed', async () => {
    const fooMarker = createMarker('foo-marker');
    const bazMarker = createMarker('baz-marker');

    const parser = sequence({
      children: [
        word({ text: 'foo', marker: fooMarker }),
        word({ text: 'bar' }),
        word({ text: 'baz', marker: bazMarker }),
      ],
    });
    const results = await getParserResults(parser, 'foo bar baz');

    expect(results).toHaveLength(1);

    const [result] = results;

    const parts = result.getParts([fooMarker]);

    expect(parts.find((part) => part.content === 'foo').marker.name).toEqual(
      'foo-marker',
    );
    expect(parts.find((part) => part.content === 'baz').marker).toEqual(
      undefined,
    );
  });
});
