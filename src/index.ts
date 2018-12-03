import { createGrammar } from './base';
import { sequence, fork, literal } from './expressions';

const grammar = createGrammar<string, string>({
  parser: sequence({
    children: [
      fork({
        children: [literal({ text: 'she' }), literal({ text: 'he' })],
      }),
      literal({ text: 'likes' }),
      fork({
        children: [literal({ text: 'cats' }), literal({ text: 'dogs' })],
      }),
    ],
  }),
});
