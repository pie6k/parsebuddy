import React, { Component } from 'react';
import { render } from 'react-dom';
import styled from 'styled-components';
import {
  CinemaGrammarResult,
  CinemaGrammarMatch,
  ticketDataHolder,
  markers,
} from './grammar';
import { ParseMatchType } from '..';
import { Marker } from '../base';

interface Props {
  result: CinemaGrammarResult;
  onClick: (matched: string) => void;
}

const Holder = styled.div`
  padding: 10px 0;
  border-bottom: 1px solid #444;
  transition: 0.33s all;
  &:hover {
    transform: scale(1.05);
  }
`;

const MatchesHolder = styled.div`
  display: flex;
  font-size: 20px;
  align-items: baseline;
  padding: 10px 0;
  cursor: pointer;
`;

const DataHolder = styled.div`
  font-family: monospace;
  font-size: 12px;
  opacity: 0.6;
`;

interface PartProps {
  marker: typeof markers[0];
  type?: ParseMatchType;
}

function getMarkerColor(marker: Marker) {
  switch (marker.name) {
    case CinemaMarker.movie:
      return '#99b433';
    case CinemaMarker.date:
      return '#7e3878';
    case CinemaMarker.city:
      return '#603cba';
    case CinemaMarker.ticketsCount:
      return '#2b5797';
    case CinemaMarker.hour:
      return '#da532c';
    default:
      return '#000';
  }
}

const ResultPart = styled.div`
  line-height: 1.5;
  font-size: 20px;
  white-space: pre;
  color: ${(props: PartProps) => getMarkerColor(props.marker)};
  font-style: ${(props: PartProps) =>
    props.type === 'placeholder' ? 'italic' : 'normal'};
  font-weight: ${(props: PartProps) =>
    props.type === 'placeholder' ? 'bold' : 'normal'};
  /* font-weight: ${(props: PartProps) =>
    props.type === 'input' ? 800 : 500}; */
  opacity: ${(props: PartProps) => (props.type === 'suggestion' ? 0.6 : 1)};
  transition: 0.33s opacity;
`;

function getSuggestionMatches(result: CinemaGrammarResult) {
  const suggestionMatches: CinemaGrammarMatch[] = [];

  let previousMatch: CinemaGrammarMatch;

  for (let match of result.getParts()) {
    if (match.type === 'suggestion' || match.type === 'placeholder') {
      if (
        suggestionMatches.length === 0 &&
        previousMatch &&
        previousMatch.type === 'input'
      ) {
        suggestionMatches.push(previousMatch);
      }
      suggestionMatches.push(match);
    }
    previousMatch = match;
  }
  return suggestionMatches;
}

export function Result({ result, onClick }: Props) {
  const suggestionMatches = getSuggestionMatches(result);
  return (
    <Holder onClick={() => onClick(result.getInputSuggestion())}>
      <MatchesHolder>
        {suggestionMatches.length > 0 && '...'}
        {suggestionMatches.map((match, index) => {
          return (
            <ResultPart key={index} marker={match.marker} type={match.type}>
              {match.content}
            </ResultPart>
          );
        })}
      </MatchesHolder>
      <DataHolder>
        Result data: {JSON.stringify(result.getData(ticketDataHolder))}
      </DataHolder>
    </Holder>
  );
}
