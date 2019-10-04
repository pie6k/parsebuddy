import {
  getParserResults,
  getParserResultsCount,
  getParserFirstResult,
} from './utils';
import { sequence, literal, number } from '..';
import { createDataHolder } from '../base';

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
    await getParserResultsCount(number({ min: 0, max: 100 }, spy), '42');
    expect(spy).toBeCalledWith(42);
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
    const parser = number({ min: 0, max: 10 });
    expect(await getParserResultsCount(parser, '-3')).toBe(0);
  });

  test('will parse float numbers by default', async () => {
    const parser = number();
    expect(await getParserResultsCount(parser, '3.14')).toBe(1);
    expect(await getParserResultsCount(parser, '-3.14')).toBe(1);
  });

  test('will not parse float numbers if disabled', async () => {
    const parser = number({ min: 0, max: 100, onlyInteger: true });
    expect(await getParserResultsCount(parser, '3.14')).toBe(0);
    expect(await getParserResultsCount(parser, '-3.14')).toBe(0);
  });

  test('will properly emit data', async () => {
    const numData = createDataHolder<number>({
      init: () => null,
      clone: (n) => n,
    });
    const parser = number({ min: -10, max: 20 }, (number) =>
      numData.set(number),
    );

    const result = await getParserFirstResult(parser, '0');
    expect(result.getData(numData)).toBe(0);
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
