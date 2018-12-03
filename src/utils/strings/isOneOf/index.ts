export function isStringOneOf<S extends string>(str: S, strList: S[]) {
  return strList.includes(str);
}
