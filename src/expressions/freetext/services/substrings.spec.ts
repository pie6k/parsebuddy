import { getSubstringsOfInput } from './substrings';

describe('substrings creator', () => {
  it('will create proper variations', () => {
    expect(getSubstringsOfInput('foo bar baz')).toEqual([
      'foo',
      'foo bar',
      'foo bar baz',
    ]);
    expect(getSubstringsOfInput('foo')).toEqual(['foo']);
    expect(getSubstringsOfInput('foo ')).toEqual(['foo']);
  });
  it('will create proper variations with multiple separators next to each other', () => {
    expect(getSubstringsOfInput('foo, bar, baz', [' ', ','])).toEqual([
      'foo',
      'foo, bar',
      'foo, bar, baz',
    ]);
    expect(getSubstringsOfInput('foo , bar, baz', [' ', ','])).toEqual([
      'foo',
      'foo , bar',
      'foo , bar, baz',
    ]);
  });
  it('handle empty strings or strings with delimiters only', () => {
    expect(getSubstringsOfInput(' , ', [' ', ','])).toEqual([' , ']);
    expect(getSubstringsOfInput('', [' ', ','])).toEqual([]);
  });
  it('handle strings beggining with glue', () => {
    expect(getSubstringsOfInput(',12 , 45', [' ', ','])).toEqual([
      ',12',
      ',12 , 45',
    ]);
  });
});
