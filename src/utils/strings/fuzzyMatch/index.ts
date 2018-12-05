type MatchRoleType = 'input' | 'fuzzy' | 'suggestion';

interface FuzzyMatchData {
  content: string;
  type: MatchRoleType;
}

export interface FuzzyMatchOptions {
  truncateTooLongInput?: boolean;
  isCaseSensitive?: boolean;
}

function compareLetters(a: string, b: string, caseSensitive: boolean) {
  if (caseSensitive) {
    return a === b;
  }

  return a.toLowerCase() === b.toLowerCase();
}

export function fuzzyMatch(
  input: string,
  stringToBeFound: string,
  { truncateTooLongInput, isCaseSensitive }: FuzzyMatchOptions = {},
): FuzzyMatchData[] | false {
  // make some validation first

  // if input is longer than string to find, and we dont truncate it - it's incorrect
  if (input.length > stringToBeFound.length && !truncateTooLongInput) {
    return false;
  }

  // if truncate is enabled - do it
  if (input.length > stringToBeFound.length && truncateTooLongInput) {
    input = input.substr(0, stringToBeFound.length);
  }

  // if input is the same as string to be found - we dont need to look for fuzzy match - return it as match
  if (input === stringToBeFound) {
    return [{ content: input, type: 'input' }];
  }

  const matchParts: FuzzyMatchData[] = [];

  const remainingInputLetters = input.split('');

  // let's create letters buffers
  // it's because we'll perform matching letter by letter, but if we have few letters matching or not matching in the row
  // we want to add them together as part of match
  let ommitedLettersBuffer: string[] = [];
  let matchedLettersBuffer: string[] = [];

  // helper functions to clear the buffers and add them to match
  function addOmmitedLettersAsFuzzy() {
    if (ommitedLettersBuffer.length > 0) {
      matchParts.push({
        content: ommitedLettersBuffer.join(''),
        type: 'fuzzy',
      });
      ommitedLettersBuffer = [];
    }
  }

  function addMatchedLettersAsInput() {
    if (matchedLettersBuffer.length > 0) {
      matchParts.push({
        content: matchedLettersBuffer.join(''),
        type: 'input',
      });
      matchedLettersBuffer = [];
    }
  }

  for (let anotherStringToBeFoundLetter of stringToBeFound) {
    const inputLetterToMatch = remainingInputLetters[0];

    // no more input - finish fuzzy matching
    if (!inputLetterToMatch) {
      break;
    }

    const doesLetterMatch = compareLetters(
      anotherStringToBeFoundLetter,
      inputLetterToMatch,
      isCaseSensitive,
    );

    // if input letter doesnt match - we'll go to the next letter to try again
    if (!doesLetterMatch) {
      // add this letter to buffer of ommited letters
      ommitedLettersBuffer.push(anotherStringToBeFoundLetter);
      // in case we had something in matched letters buffer - clear it as matching letters run ended
      addMatchedLettersAsInput();
      // go to the next input letter
      continue;
    }

    // we have input letter matching!

    // remove it from remaining input letters
    remainingInputLetters.shift();

    // add it to matched letters buffer
    matchedLettersBuffer.push(anotherStringToBeFoundLetter);
    // in case we had something in ommited letters buffer - add it to the match now
    addOmmitedLettersAsFuzzy();

    // if there is no more letters in input - add this matched letter to match too
    if (!remainingInputLetters.length) {
      addMatchedLettersAsInput();
    }
  }

  // if we still have letters left in input - means not all input was included in string to find - input was incorrect
  if (remainingInputLetters.length > 0) {
    return false;
  }

  // lets get entire matched part (from start to last letter of input)
  const matchedPart = matchParts.map((match) => match.content).join('');

  // get remaining part of string to be found
  const suggestionPart = stringToBeFound.replace(matchedPart, '');

  // if we have remaining part - add it as suggestion
  if (suggestionPart) {
    matchParts.push({ content: suggestionPart, type: 'suggestion' });
  }

  // return everything we've got
  return matchParts;
}
