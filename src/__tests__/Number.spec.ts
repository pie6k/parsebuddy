import { number } from '~/expressions/number';
import {
  getParserResults,
  getParserResultsCount,
  getParserFirstResultData,
} from './utils';
import { sequence, literal } from '~/expressions';

const numberTest = number();
const numberLimitTest = number({ max: 30, min: 5 });

describe('number parser', async () => {
  test('will match number', async () => {
    expect(await getParserResultsCount(numberTest, '00')).toBe(1);
    expect(await getParserResultsCount(numberTest, '3')).toBe(1);
    expect(await getParserResultsCount(numberTest, '30')).toBe(1);
  });

  test('will emit proper number', async () => {
    const spy = jest.fn();
    await getParserResultsCount(number({}, spy), '42');
    expect(spy).toBeCalledWith(null, 42);
  });

  test('will not match non-numbers', async () => {
    expect(await getParserResultsCount(numberTest, 'test')).toBe(0);
    expect(await getParserResultsCount(numberTest, 'some 30')).toBe(0);
    expect(await getParserResultsCount(numberTest, 'some30')).toBe(0);
  });

  test('will allow numbers with letter attached when whitespaces allowed', async () => {
    const parser = sequence({
      children: [number(), literal({ text: 'times' })],
    });
    expect(await getParserResultsCount(parser, '3times')).toBe(1);
    expect(await getParserResultsCount(parser, '30times')).toBe(1);
    expect(await getParserResultsCount(parser, '30times')).toBe(1);
  });

  test('will allow negative numbers by default', async () => {
    expect(await getParserResultsCount(numberTest, '-3')).toBe(1);
    expect(await getParserResultsCount(numberTest, '-0')).toBe(1);
  });

  test('will ignore negative numbers if disabled', async () => {
    const parser = number({ ignoreNegative: true });
    expect(await getParserResultsCount(parser, '-3')).toBe(0);
  });

  test('will parse float numbers by default', async () => {
    const parser = number();
    expect(await getParserResultsCount(parser, '3.14')).toBe(1);
    expect(await getParserResultsCount(parser, '-3.14')).toBe(1);
  });

  test('will not parse float numbers if disabled', async () => {
    const parser = number({ onlyInteger: true });
    expect(await getParserResultsCount(parser, '3.14')).toBe(0);
    expect(await getParserResultsCount(parser, '-3.14')).toBe(0);
  });

  test('will properly emit data', async () => {
    const parser = number({}, (holder, number) => number);
    // expect(await getParserFirstResultData(parser, '3.14')).toBe(3.14);
    // expect(await getParserFirstResultData(parser, '-3.14')).toBe(-3.14);
    // expect(await getParserFirstResultData(parser, '2')).toBe(2);
    expect(await getParserFirstResultData(parser, '0')).toBe(0);
  });

  test('will respect limits', async () => {
    expect(await getParserResultsCount(numberLimitTest, '3')).toBe(0);
    expect(await getParserResultsCount(numberLimitTest, '4')).toBe(0);
    expect(await getParserResultsCount(numberLimitTest, '5')).toBe(1);
    expect(await getParserResultsCount(numberLimitTest, '20')).toBe(1);
    expect(await getParserResultsCount(numberLimitTest, '30')).toBe(1);
    expect(await getParserResultsCount(numberLimitTest, '31')).toBe(0);
    expect(await getParserResultsCount(numberLimitTest, '300')).toBe(0);
  });
});
