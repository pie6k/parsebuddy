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

interface TicketsData {
  movie?: string;
  date?: Date;
  city?: string;
  hour?: number;
  ticketsCount?: number;
  weekday?: number;
}

const movie = defineParser<{}, string>(
  function(options, emit) {
    return fork({
      children: moviesList.map((movieName) =>
        literal({ text: movieName }, emit),
      ),
    });
  },
  { name: 'movie' },
);

const city = defineParser<{}, string>(
  function(options, emit) {
    return fork({
      children: cities.map((city) => literal({ text: city }, emit)),
    });
  },
  { name: 'movie' },
);

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
  { name: 'movie' },
);

const hour = defineParser<{}, number>(
  function(options, emit) {
    let hour: number;
    let ampm: 'am' | 'pm';

    return sequence({
      onMatch: () => {
        console.log({ ampm, hour });
        if (ampm === 'pm') {
          emit(hour + 12);
        }
        if (ampm === 'am') {
          emit(hour);
        }
      },
      children: [
        number(
          {
            placeholder: '1-12',
            min: 1,
            max: 12,
            generateSuggestions: true,
          },
          (matchedHour) => {
            hour = matchedHour;
          },
        ),
        fork({
          placeholder: 'am/pm',
          children: [
            literal({ text: 'am' }, () => {
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
    return fork({
      children: [
        word({ text: '1 person' }, () => {
          emit(1);
        }),
        sequence({
          children: [
            number(
              {
                placeholder: '2-5 people',
                min: 2,
                max: 5,
                generateSuggestions: true,
              },
              (count) => emit(count),
            ),
            word({ text: 'people' }),
          ],
        }),
      ],
    });
  },
  { name: 'movie' },
);

type PromiseType<T> = T extends Promise<infer U> ? U : T;

export type CinemaGrammarResult = PromiseType<
  ReturnType<typeof cinemaGrammar.parseAll>
>[0];

export type CinemaGrammarMatch = CinemaGrammarResult['matches'][0];

export const cinemaGrammar = createGrammar<TicketsData, CinemaMarker>({
  dataHolder: {
    init: () => ({}),
    clone: (data) => ({ ...data }),
  },
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
