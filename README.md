# parsebuddy

ParserBuddy alows parsing arbitral text input with structured grammar.

[demo page](https://pie6k.github.io/parsebuddy/)

It allows you to create grammar that will parse sentence like 

`buy tickets for The Shawshank Redemption in Los Angeles on wednesday at 2pm for 4 people `

and return data like 
```ts
{
  movie: 'The Shawshank Redemption',
  city: 'Los Angeles',
  weekday: 2,
  hour: 14,
  ticketsCount: 4,
}
```

## Demo grammar

TODO: write tutorial instead of copy-pasting the code

However, I've tried to explain everything with comments


```ts
import {
  createGrammar,
  sequence,
  word,
  defineParser,
  fork,
  literal,
  number,
} from '..';
import { moviesList } from './movies';
import { cities } from './cities';

export enum CinemaMarker {
  movie = 'Movie Name',
  date = 'Date',
  city = 'City',
  hour = 'Hour',
  ticketsCount = 'Tickets Count',
}

// data that will transport parsing result
interface TicketsData {
  movie?: string;
  date?: Date;
  city?: string;
  hour?: number;
  ticketsCount?: number;
  weekday?: number;
}

// parser able to pass one of the movies from the list
const movie = defineParser<{}, string>(
  function(options, emit) {
    // it's fork (fork picks one of the items)
    return fork({
      // get array of the movies and return literal parser (literal requires some exact input). when matched - emit movie name
      children: moviesList.map((movieName) =>
        literal({ text: movieName }, emit),
      ),
    });
  },
  { name: 'movie' },
);

// same as movie, but with cities list
const city = defineParser<{}, string>(
  function(options, emit) {
    return fork({
      children: cities.map((city) => literal({ text: city }, emit)),
    });
  },
  { name: 'city' },
);

// parser that will parse any weekday name but instead of emiting it's name, it will emit number from 0 to 6 (0 = monday, 6 = sunday)
const weekday = defineParser<{}, number>(
  function(options, emit) {
    return fork({
      placeholder: 'weekday',
      children: [
        literal({ text: 'monday' }, () => {
          emit(0);
        }),
        literal({ text: 'tuesday' }, () => {
          emit(1);
        }),
        literal({ text: 'wednesday' }, () => {
          emit(2);
        }),
        literal({ text: 'thursday' }, () => {
          emit(3);
        }),
        literal({ text: 'friday' }, () => {
          emit(4);
        }),
        literal({ text: 'saturday' }, () => {
          emit(5);
        }),
        literal({ text: 'sunday' }, () => {
          emit(6);
        }),
      ],
    });
  },
  { name: 'weekday' },
);

// parser that takes input like 3am or 3pm - it will return number from 1 to 24 (if it's pm it just adds 12 to parsed number)
const hour = defineParser<{}, number>(
  function(options, emit) {
    // lets hold parsed hour number and am/pm
    let hour: number;
    let ampm: 'am' | 'pm';

    return sequence({
      // when parsing is complete
      onMatch: () => {
        // if it's pm - emit parsed number + 12
        if (ampm === 'pm') {
          emit(hour + 12);
        }
        // just emit parsed number
        if (ampm === 'am') {
          emit(hour);
        }
      },
      children: [
        // first we expect number between 1-12
        number(
          {
            // before user aproach it, show some meaningful placeholder in suggestion
            placeholder: '1-12',
            min: 1,
            max: 12,
            // we will generate 12 suggestions for the numbers - this flag must be explicitly enabled as for many cases you'd have much more suggestions (for unlimited numbers)
            generateSuggestions: true,
            onlyInteger: true,
          },
          (matchedHour) => {
            // save matched hour when matched, but dont emit it yet as we need to know if it's followed by pm or am
            hour = matchedHour;
          },
        ),
        // one of am or pm
        fork({
          placeholder: 'am/pm',
          children: [
            literal({ text: 'am' }, () => {
              // when matched overwrite variable holding am/pm so we'll know what to emit
              ampm = 'am';
            }),
            literal({ text: 'pm' }, () => {
              ampm = 'pm';
            }),
          ],
        }),
      ],
    });
  },
  { name: 'hour' },
);

const ticketsCount = defineParser<{}, number>(
  function(options, emit) {
    // we can have 1 person or 2-4 people. so we need to show different 2nd word (person/people) - that's why we'll create fork
    return fork({
      children: [
        // first case - just '1 person' - emit number 1
        word({ text: '1 person' }, () => {
          emit(1);
        }),
        // 2nd option - sequence of number followed by word 'people'
        sequence({
          children: [
            number(
              {
                placeholder: '2-5 people',
                min: 2,
                max: 5,
                generateSuggestions: true,
                onlyInteger: true,
              },
              (count) => emit(count), // when matched - just emit the number
            ),
            word({ text: 'people' }),
          ],
        }),
      ],
    });
  },
  { name: 'ticketsCount' },
);

// compose final grammar
export const cinemaGrammar = createGrammar<TicketsData, CinemaMarker>({
  // as we need data transporter (we want to have some meaningful informations from sentence that is parsed)
  // we need to let parser know how to create new data transporter and how to clone it (in case we'd have 2 or more suggestions from the same input)
  dataHolder: {
    // init it by creating empty object
    init: () => ({}),
    // clone it with simple flat object clone
    clone: (data) => ({ ...data }),
  },
  // create grammar root parser that emits data to data transporter
  parser: sequence({
    children: [
      word({ text: 'buy tickets for' }),
      movie(
        { placeholder: 'movie name', marker: CinemaMarker.movie },
        (movie, data) => ({ ...data, movie }),
      ),
      word({ text: 'in' }),
      city(
        { placeholder: 'cinema location', marker: CinemaMarker.city },
        (city, data) => ({ ...data, city }),
      ),
      word({ text: 'on' }),
      weekday(
        { placeholder: 'weekday', marker: CinemaMarker.date },
        (weekday, data) => ({ ...data, weekday }),
      ),
      word({ text: 'at' }),
      hour(
        { placeholder: 'hour', marker: CinemaMarker.hour },
        (hour, data) => ({ ...data, hour }),
      ),
      word({ text: 'for' }),
      ticketsCount(
        {
          placeholder: 'people count',
          marker: CinemaMarker.ticketsCount,
        },
        (ticketsCount, data) => ({ ...data, ticketsCount }),
      ),
    ],
  }),
});

// just helper types

type PromiseType<T> = T extends Promise<infer U> ? U : T;

export type CinemaGrammarResult = PromiseType<
  ReturnType<typeof cinemaGrammar.parseAll>
>[0];

export type CinemaGrammarMatch = CinemaGrammarResult['matches'][0];


```
