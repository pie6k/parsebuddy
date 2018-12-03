import { ParsingBranch } from './index';

interface TestDataHolder {
  foo: string;
}

function getTestBranch() {
  return new ParsingBranch<TestDataHolder, any>({
    input: 'foo bar baz',
    dataHolder: {
      init: () => ({
        foo: 'bar',
      }),
      clone: (foo) => ({ ...foo }),
    },
  });
}

describe('ParsingBranch', () => {
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

  it('properly initializes data', () => {
    expect(getTestBranch().getDataHolder().foo).toBe('bar');
  });

  it('properly clones data object', () => {
    const branch = getTestBranch();
    const originalData = branch.getDataHolder();
    const cloneData = branch.clone().getDataHolder();

    expect(originalData).not.toBe(cloneData);
    expect(originalData).toEqual(cloneData);
  });

  it('properly gets input without matches', () => {
    expect(getTestBranch().getInput()).toEqual('foo bar baz');
  });

  it('will not allow adding match with incorrect input', () => {
    expect(() => {
      getTestBranch().addMatch({ content: '', type: 'input' });
    }).toThrow();
    expect(() => {
      getTestBranch().addMatch({ content: 'bar', type: 'input' });
    }).toThrow();
    // expect(() => {
    //   getTestBranch().addMatch({ text: 'foo', type: 'input' });
    // }).not.toThrow();
  });

  it('properly gets input with matches', () => {
    const branch = getTestBranch();
    expect(branch.getInput()).toEqual('foo bar baz');
    branch.addMatch({ content: 'foo ', type: 'input' });
    expect(branch.getInput()).toEqual('bar baz');
    branch.addMatch({ content: 'bar ', type: 'input' });
    expect(branch.getInput()).toEqual('baz');
    branch.addMatch({ content: 'baz', type: 'input' });
    expect(branch.getInput()).toEqual('');
    expect(branch.hasMoreInput()).toEqual(false);
  });
});
