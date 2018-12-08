import { createParserFactory, ParsingBranch } from '../../base/parser';
import { literal } from '../literal';
import { sequence } from '../sequence';
import { fork } from '../fork';

// const DEFAULT_GLUE = [' and '];
const MAXIMUM_REPEATS_COUNT = 6; // it's here for performance reasons. repeating expression with forks inside can quickly grow to hundreds of possible results

interface RepeatOptions {
  glue: string[] | string;
  limit?: number;
  unique?: boolean;
  repetitionPlaceholder?: string;
}

/**
 * In case of repeating expression it looks like
 * (subject: A, glue: and)
 * example A and A and A and A
 * it consists of initial A and then glue connected with subject
 *
 * first match: "A"
 * another matches: one or more "and A"
 *
 * this is how this parser is implemented
 */

function getGlueArray(glue: string[] | string) {
  const glueArray = typeof glue === 'string' ? [glue] : glue;
  return glueArray;
}

function getGlueParser(glueArray: string[]) {
  return fork({
    children: glueArray.map((glue) => {
      return literal({ text: glue });
    }),
  });
}

export const repeat = createParserFactory<RepeatOptions, never>(
  async function*(
    branch,
    {
      options: {
        children: chilrenParsers,
        marker,
        glue,
        limit,
        unique,
        placeholder,
        repetitionPlaceholder,
      },
    },
  ) {
    // just subject
    const subject = chilrenParsers[0];
    const glueAsArray = getGlueArray(glue);

    // subject starting with its glue
    const repeatSequence = sequence({
      placeholder: repetitionPlaceholder || glueAsArray[0],
      children: [
        // create expression from all possible repeats glue strings
        getGlueParser(glueAsArray),
        subject,
      ],
    });

    // this is nested function that is able to spread result branches more and more with every other repeat.
    // it will stop when limit is reached
    async function* spreadResultsForAnotherRepeat(
      startBranch: ParsingBranch<any, any>,
      remainingRepeats: number,
    ): AsyncIterableIterator<ParsingBranch<any, any>> {
      if (remainingRepeats <= 1) {
        return;
      }
      if (
        startBranch.isFinished() ||
        startBranch.hasMatchOfType('suggestion')
      ) {
        return;
      }
      const repeatResultBranches = repeatSequence(startBranch.clone());
      for await (let branchWithAnotherRepetition of repeatResultBranches) {
        // yield another repetition
        yield branchWithAnotherRepetition;

        // also yield all possible - recursive, following repeats
        if (remainingRepeats <= 1) {
          return;
        }

        if (branchWithAnotherRepetition.isFinished()) {
          return;
        }

        yield* spreadResultsForAnotherRepeat(
          branchWithAnotherRepetition,
          remainingRepeats - 1, // reduce limit by one
        );
      }
    }

    const resultsAfterFirstRepeat = subject(branch.clone());
    for await (let branchWithSubject of resultsAfterFirstRepeat) {
      yield branchWithSubject; // first occurience of subject (that is not yet repeating) is also valid result
      yield* spreadResultsForAnotherRepeat(branchWithSubject, limit);
    }
  },
  {
    name: 'repeat',
    defaultOptions: {
      // glue: DEFAULT_GLUE,
      limit: MAXIMUM_REPEATS_COUNT,
    },
    areOptionsValid: ({ children, limit }) => {
      if (children.length !== 1) {
        throw new Error('Repeat expressions allows only single children.');
      }

      if (limit > MAXIMUM_REPEATS_COUNT) {
        throw new Error(
          `Repeat count limit is too big. Maximum is ${MAXIMUM_REPEATS_COUNT}`,
        );
      }
    },
  },
);
