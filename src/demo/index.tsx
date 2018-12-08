import React, { Component } from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';
import { debounce } from 'lodash';

import { Result } from './Result';
import { cinemaGrammar, CinemaGrammarResult } from './grammar';

const Holder = styled.div`
  font-family: Helvetica Neue, sans-serif;
  max-width: 1400px;
  margin: 100px auto;
  padding: 20px;
  &,
  & * {
    box-sizing: border-box;
  }
`;

const IntroHolder = styled.div`
  padding: 20px 0;
  font-weight: bold;
  opacity: 0.2;
  font-family: inherit;
`;
const SearchFormHolder = styled.div``;
const SearchInput = styled.input`
  display: block;
  width: 100%;
  padding: 25px;
  font: inherit;
  font-weight: bold;
  font-size: 18px;
  border: 2px solid #ddd;
  outline: none;
  &:focus {
    border-color: #bbb;
  }
`;

const ResultsHolder = styled.div``;

interface State {
  results: CinemaGrammarResult[];
  searchTerm: string;
}

class Demo extends Component<{}, State> {
  state: State = {
    results: [],
    searchTerm: '',
  };

  private input: HTMLInputElement;

  search = async (term: string) => {
    this.updateTerm(term);

    if (!term.trim()) {
      this.setState({ results: [] });
      return;
    }
    console.time('match');
    const results = await cinemaGrammar.parseAll(term);
    console.timeEnd('match');

    this.setState({ results });
  };

  updateTerm = (searchTerm: string) => {
    this.setState({ searchTerm });
    this.input.focus();
    this.input.setSelectionRange(searchTerm.length, searchTerm.length);
  };

  componentDidMount() {
    this.search(this.state.searchTerm);
  }

  render() {
    const { results, searchTerm } = this.state;
    return (
      <Holder>
        <SearchFormHolder>
          <SearchInput
            ref={(input) => (this.input = input)}
            value={searchTerm}
            placeholder="Start with 'buy tickets'..."
            onChange={(event) => this.search(event.target.value)}
          />
          <IntroHolder>
            Simple grammar will guide you trough buying cinema ticket and will
            show parsed data under given result
          </IntroHolder>
        </SearchFormHolder>
        <ResultsHolder>
          {results.slice(0, 20).map((result, index) => {
            return <Result onClick={this.search} key={index} result={result} />;
          })}
          {results.length === 0 && <div>No results</div>}
        </ResultsHolder>
      </Holder>
    );
  }
}

render(<Demo />, document.getElementById('app'));
