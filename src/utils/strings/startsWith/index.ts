export interface StartWithOptions {
  caseSensitive?: boolean;
  preserveCaseOfSubstring?: boolean; // startsWith('test', 'Te') => ['Te', 'st]
}

function startsWithBasic(
  what: string,
  withWhat: string,
  caseSensitive: boolean,
) {
  if (withWhat.length > what.length) {
    withWhat = withWhat.substr(0, what.length);
  }

  if (caseSensitive) {
    return what.startsWith(withWhat);
  }

  return what.toLowerCase().startsWith(withWhat.toLowerCase());
}

export function startsWith(
  what: string,
  withWhat: string,
  {
    caseSensitive = false,
    preserveCaseOfSubstring = false,
  }: StartWithOptions = {},
): [string, string] | false {
  if (!startsWithBasic(what, withWhat, caseSensitive)) {
    // return false;
  }

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
