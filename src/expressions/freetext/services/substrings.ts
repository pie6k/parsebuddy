function* generateSubstrings(
  input: string,
  delimiters: string[],
  currentPrefix = '',
): IterableIterator<string> {
  const delimitersRegExpBase = `(?:${delimiters.join('|')}|$)+`;
  const delimitersRegExp = RegExp(`${delimitersRegExpBase}`);
  const variationOnStartRegExp = RegExp(
    `^((?:${delimitersRegExpBase})*)?(.+?)${delimitersRegExpBase}`,
  );

  /**
   * will match part on beggining of string together with delimiter, but having
   * match without delimiter as matching group
   */
  const variationsOnStart = variationOnStartRegExp.exec(input);
  if (!variationsOnStart) {
    return;
  }

  /**
   * eg. for ',12 ' - its [',12 ', ',', '12']
   */
  const [
    variationWithDelimiters,
    delimitersOnBeginning,
    variationWithoutDelimiters,
  ] = variationsOnStart;

  /**
   * Edge case: if there are only delimiters inside input
   * eg ' , '
   * It'd treat first spacebar as part 'before delimiter'.
   * We're detecting such case here and if it's true, we yield full match
   */
  const [delimiterInDelimiter] = variationWithoutDelimiters.match(
    delimitersRegExp,
  );
  if (delimiterInDelimiter.length) {
    return yield variationWithDelimiters;
  }

  /**
   * yielded value is without delimiter suffix
   */
  yield `${currentPrefix}${delimitersOnBeginning ||
    ''}${variationWithoutDelimiters}`;

  /**
   * cut beggining including delimiter
   */
  const newInput = input.replace(variationOnStartRegExp, '');
  /**
   * new prefix is with delimiter as we want to preserve original look of strings
   */
  const newPrefix = `${currentPrefix}${variationWithDelimiters}`;

  yield* generateSubstrings(newInput, delimiters, newPrefix);
}

export function getSubstringsOfInput(
  input: string,
  delimiters: string[] = [' ', ','],
): string[] {
  return Array.from(generateSubstrings(input, delimiters));
}
