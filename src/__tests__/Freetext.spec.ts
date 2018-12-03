import { freetext } from '~/expressions/freetext';
import { getParserResults, getParserResultsCount } from './utils';
import { sequence, literal } from '~/expressions';

const freetextTest = freetext({ splitBy: [' ', ','] });
const freetextTestWithLimit = freetext({
  maxLength: 10,
  splitBy: [' ', ','],
});

const freetextTestWithCustomGlues = freetext({
  splitBy: ['foo'],
});

describe('freetext parser', () => {
  test('will not pass empty text', async () => {
    expect(await getParserResultsCount(freetextTest, '')).toBe(0);
  });

  test('will allow any text', async () => {
    expect(await getParserResultsCount(freetextTest, 'te')).toBe(1);
    expect(await getParserResultsCount(freetextTest, ' te')).toBe(1);
  });

  test('will create new branch for every word', async () => {
    // expect(await getParserResultsCount(freetextTest, 'te')).toEqual(1);
    expect(
      await getParserResultsCount(freetextTest, 'te st word another here', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(5);
    expect(
      await getParserResultsCount(freetextTest, 'te st', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(2);
  });

  test('will respect limits', async () => {
    expect(
      await getParserResultsCount(freetextTestWithLimit, '12 45 78 0', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(4);
    expect(
      await getParserResultsCount(freetextTestWithLimit, '12 45 78 01', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(3);
    expect(
      await getParserResultsCount(freetextTestWithLimit, '12 45 78 01 23', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(3);
  });

  test('will properly split when there are multiple glues in a row', async () => {
    expect(
      await getParserResultsCount(freetextTest, '12  45', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(2);
    expect(
      await getParserResultsCount(freetextTest, '12,  45', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(2);
    expect(
      await getParserResultsCount(freetextTest, '12 , 45 , 50', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(3);
    expect(
      await getParserResultsCount(freetextTest, ',12 , 45 , 50', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(3);
  });

  test('will properly handle input with only split glues', async () => {
    expect(
      await getParserResultsCount(freetextTest, ' ', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(1);
    expect(
      await getParserResultsCount(freetextTest, '  ', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(1);
    expect(
      await getParserResultsCount(freetextTest, ' , ', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(1);
    expect(
      await getParserResultsCount(freetextTest, ', , , ', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(1);
  });

  test('will handle freetext that could be also parsed by following parsers', async () => {
    const parser = sequence({
      children: [
        literal({ marker: 'intro', text: 'my name is ' }),
        freetext({ marker: 'name' }),
        literal({ marker: 'outro', text: ' foo' }),
      ],
    });
    expect(
      await getParserResults(parser, 'my name is john foo', {
        requireEntireInputToBeParsed: false,
      }),
    ).toHaveLength(2);
  });

  test('will properly handle custom glues', async () => {
    expect(
      await getParserResultsCount(freetextTestWithCustomGlues, 'barfoobar', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(2);
    expect(
      await getParserResultsCount(freetextTestWithCustomGlues, 'bar foobar', {
        requireEntireInputToBeParsed: false,
      }),
    ).toEqual(2);
    expect(
      await getParserResultsCount(
        freetextTestWithCustomGlues,
        'barfoobarfoobar',
        {
          requireEntireInputToBeParsed: false,
        },
      ),
    ).toEqual(3);
  });

  test('to exclude parts of input that starts within limit but ends outside of it', async () => {
    expect(
      await getParserResultsCount(
        freetextTestWithLimit,
        'longwordtoolongtobeincluded',
        {
          requireEntireInputToBeParsed: false,
        },
      ),
    ).toBe(0);
    const results = await getParserResults(
      freetextTestWithLimit,
      'test longwordtoolongtobeincluded',
      {
        requireEntireInputToBeParsed: false,
      },
    );

    expect(results).toHaveLength(1);

    const [firstResult] = results;

    expect(firstResult.matches.length).toBe(1);
    expect(firstResult.matches[0].content).toBe('test');
  });
});
