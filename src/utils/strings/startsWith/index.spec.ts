import { startsWith, StartWithOptions } from './index';

describe('startsWith helper', () => {
  it('rejects wrong input', () => {
    expect(startsWith('foo', 'bar')).toBeFalsy();
    expect(startsWith('fo', 'foo')).toBeFalsy();
  });

  it('rejects wrong input', () => {
    expect(startsWith('bar', 'r')).toBeFalsy();
  });

  it('rejects wrong input', () => {
    expect(startsWith('fooo', 'foo')).toEqual(['foo', 'o']);
  });

  it('handle empty values', () => {
    expect(startsWith('foo', '')).toBeTruthy();
    expect(startsWith('', 'foo')).toBeFalsy();
  });

  it('preserve case', () => {
    expect(startsWith('Foo', 'fo')).toEqual(['Fo', 'o']);
  });

  it('respects case sensitive', () => {
    expect(
      startsWith('Foo', 'fo', {
        caseSensitive: true,
      }),
    ).toEqual(false);
  });

  it('will preserve substring case when enabled', () => {
    expect(
      startsWith('test', 'Te', {
        preserveCaseOfSubstring: true,
      }),
    ).toEqual(['Te', 'st']);
  });

  it('will properly handle default options', () => {
    expect(startsWith('Foo', 'fo')).toEqual(['Fo', 'o']);
  });

  it('respect disabled trimming', () => {
    expect(startsWith(' Foo', 'fo ', { caseSensitive: false })).toEqual(false);

    expect(
      startsWith(' Foo bar ', 'foo ba ', {
        caseSensitive: false,
      }),
    ).toEqual(false);
  });
});
