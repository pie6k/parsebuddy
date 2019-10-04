import { ParsingBranch, createDataHolder } from './index';

interface TestDataHolder {
  foo: string;
}

function getTestBranch() {
  return new ParsingBranch({
    input: 'foo bar baz',
  });
}

describe('ParsingBranch', () => {
  const stringData = createDataHolder({
    init: () => '',
    clone: (data) => data,
  });
  it('requires correct input to be passed', () => {
    expect(() => {
      new (ParsingBranch as any)();
    }).toThrow();
    expect(() => {
      new ParsingBranch({
        input: undefined,
      });
    }).toThrow();
  });

  it('properly gets input without matches', () => {
    expect(getTestBranch().getInput()).toEqual('foo bar baz');
  });

  it('will not allow adding match with incorrect input', () => {
    expect(() => {
      getTestBranch().addMatch({ content: '', type: 'input', marker: null });
    }).toThrow();
    expect(() => {
      getTestBranch().addMatch({ content: 'bar', type: 'input', marker: null });
    }).toThrow();
    // expect(() => {
    //   getTestBranch().addMatch({ text: 'foo', type: 'input' });
    // }).not.toThrow();
  });

  it('properly gets input with matches', () => {
    const branch = getTestBranch();
    expect(branch.getInput()).toEqual('foo bar baz');
    branch.addMatch({ content: 'foo ', type: 'input', marker: null });
    expect(branch.getInput()).toEqual('bar baz');
    branch.addMatch({ content: 'bar ', type: 'input', marker: null });
    expect(branch.getInput()).toEqual('baz');
    branch.addMatch({ content: 'baz', type: 'input', marker: null });
    expect(branch.getInput()).toEqual('');
    expect(branch.hasMoreInput()).toEqual(false);
  });
});
