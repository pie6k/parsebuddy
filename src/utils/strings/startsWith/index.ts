export interface StartWithOptions {
  caseSensitive?: boolean;
  preserveCaseOfSubstring?: boolean; // startsWith('test', 'Te') => ['Te', 'st]
}

export function startsWith(
  what: string,
  withWhat: string,
  {
    caseSensitive = false,
    preserveCaseOfSubstring = false,
  }: StartWithOptions = {},
): [string, string] | false {
  const originalWithWhat = withWhat;
  let whatCaseAware = what;
  if (!caseSensitive) {
    withWhat = withWhat.toLowerCase();
    whatCaseAware = whatCaseAware.toLowerCase();
  }

  const position = whatCaseAware.indexOf(withWhat);

  // make sure first letter is indeed start
  const startsWhenTrimmed = whatCaseAware.indexOf(withWhat) === 0;
  if (!startsWhenTrimmed) {
    return false;
  }

  if (position >= 0) {
    const endPosition = position + withWhat.length;
    const originalStart = what.substr(0, endPosition);
    const originalEnd = what.substr(endPosition);

    if (preserveCaseOfSubstring) {
      const startWithSubstringCase =
        what.substr(0, position) + originalWithWhat;
      return [startWithSubstringCase, originalEnd];
    }
    return [originalStart, originalEnd];
  }
  return false;
}
