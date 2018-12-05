import { fuzzyMatch, FuzzyMatchOptions } from './index';

const fullPattern = 'lorem ipsum dolor';

function resultsFor(input: string, options?: FuzzyMatchOptions) {
  const matches = fuzzyMatch(input, fullPattern, options);

  if (!matches) {
    return null;
  }

  return matches.map((match) => match.content);
}

describe('fuzzyMatch', () => {
  it('returns correct results', () => {
    // prettier-ignore
    expect(resultsFor('lid')).toEqual(['l', 'orem ', 'i', 'psum ', 'd', 'olor']);
    // prettier-ignore
    expect(resultsFor('lorempsum')).toEqual(['lorem', ' i', 'psum', ' dolor']);
  });

  it('returns truncate too long input if allowed', () => {
    // prettier-ignore
    expect(resultsFor('lorem ipsum dolor amet', {truncateTooLongInput: true})).toEqual(['lorem ipsum dolor']);
  });

  it('returns false for bad input', () => {
    // prettier-ignore
    expect(resultsFor('b', {truncateTooLongInput: true})).toEqual(null);
  });
});
