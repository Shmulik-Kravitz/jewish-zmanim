# Jewish Zmanim

A TypeScript library for calculating the daily halachic times (זמנים) that a Jewish app needs — alos hashachar, netz, sof zman krias shema and tefila, chatzos, mincha gedola, plag hamincha, shkiah, tzeis hakochavim, Rabbeinu Tam, and Shabbos candle-lighting / havdalah.

Built for Jewish developers who want accurate zmanim,computes the shaah zmanis in both the GRA and the Alter Rebbe / Magen Avraham shitos, and applies the right minhag defaults out of the box — 40 minutes candle-lighting in Yerushalayim, 30 minutes elsewhere in Eretz Yisrael, 18 minutes in chutz la'aretz, and the correct misheyakir degree for Israel vs. the diaspora.

Give it a built-in city or just GPS coordinates and it resolves the timezone and DST for you.

## Installation

```bash
npm install jewish-zmanim
# or
yarn add jewish-zmanim
```

## Usage

### From a built-in city

```typescript
import { Zmanim, cities } from 'jewish-zmanim';

const date = new Date('2026-02-08');
const z = Zmanim.fromCityRow(cities.israel.jerusalem, date);

const t = z.getTimes();
console.log(t.netzHachama);    // "6:27:37"  Sunrise (netz)
console.log(t.kriasShema);     // "9:10:33"  Latest Shema (GRA / Baal HaTanya)
console.log(t.chatzos);        // "11:53:31" Midday
console.log(t.shkiah);         // "17:19:25" Sunset (shkiah)
console.log(t.tzesHakochavim); // "17:56:56" Nightfall (8.5°)
console.log(t.shabbosEnter);   // "16:47:58" Candle lighting (40 min in Yerushalayim)
```

### From GPS coordinates

Pass only latitude, longitude, and a date — the IANA timezone and DST are detected automatically:

```typescript
import { Zmanim } from 'jewish-zmanim';

const z = Zmanim.fromCoordinates(31.7683, 35.2137, new Date('2026-07-15'));

console.log(z.timezoneInfo.timezoneName); // "Asia/Jerusalem"
console.log(z.timezoneInfo.offset);       // 3 (IDT — DST auto-detected)
console.log(z.timezoneInfo.dst);          // true

const t = z.getTimes();
console.log(t.netzHachama);  // Sunrise
console.log(t.shkiah);       // Sunset
```

Optionally override the timezone or tune the calculation:

```typescript
Zmanim.fromCoordinates(31.7683, 35.2137, new Date('2026-02-08'), {
  timezoneName: 'Asia/Jerusalem', // IANA override (otherwise auto-detected)
  elevation: 800,                 // meters above sea level
  candleMinutes: 40,              // candle-lighting minutes before shkiah
  tefillinDeg: 11.5,              // misheyakir sun depression in degrees
});
```

## Shabbat & Yom Tov status

`getTimes()` also returns two live boolean flags — `isShabbat` and `isYomTov` — powered by the [`jewish-holidays`](https://www.npmjs.com/package/jewish-holidays) package. Unlike a plain calendar lookup, they are **time-aware**: they follow the halachic day, which runs from candle-lighting on the erev to tzeis (nightfall).

```typescript
import { Zmanim, cities } from 'jewish-zmanim';

// Friday evening, after candle-lighting → already Shabbat
const erev = Zmanim.fromCityRow(cities.israel.jerusalem, new Date('2026-07-17T19:30:00'));
console.log(erev.getTimes().isShabbat); // true

// Saturday night, after tzeis → Shabbat is over
const motzash = Zmanim.fromCityRow(cities.israel.jerusalem, new Date('2026-07-18T23:00:00'));
console.log(motzash.getTimes().isShabbat); // false
```

- **`isShabbat`** — `true` on Shabbat before tzeis, and on Erev Shabbat once past candle-lighting (`shabbosEnter`).
- **`isYomTov`** — `true` on Yom Tov before tzeis, and on Erev Yom Tov once past candle-lighting. Multi-day festivals (e.g. the two days of Rosh Hashana, or diaspora second days) stay `true` through the intervening night and only end at tzeis on the final day. Israel vs. diaspora (`isChutzLaaretz`) is derived automatically from the city/coordinates.

The reference moment is the **time-of-day of the `Date` you pass in**. A date-only value (midnight) therefore reports the plain calendar-day status; pass a full timestamp (or `new Date()`) to get the exact live status.

## Available cities

```typescript
cities.israel.jerusalem   
cities.israel.telAviv      
cities.israel.haifa
cities.israel.safed       
cities.israel.beitShemesh  
cities.israel.modiin
cities.israel.maalehAdumim 
cities.israel.beerSheva   
cities.israel.eilat
cities.israel.kiryatMalachi
cities.unitedStates.newYork  
cities.unitedStates.brooklyn  
cities.unitedStates.miami
cities.france.paris          
cities.france.sarcelles
cities.unitedKingdom.london  
cities.australia.melbourne
```

or use any GPS coordinates

## API

| Method | Returns | Description |
|--------|---------|-------------|
| `Zmanim.fromCityRow(row, date)` | `Zmanim` | Build from a built-in `cities.*` entry |
| `Zmanim.fromCoordinates(lat, lng, date, opts?)` | `Zmanim & { timezoneInfo }` | Auto timezone + DST from coordinates |
| `z.getTimes()` | `ZmanimTimes` | All halachic times for the day, fully typed |

### `ZmanimTimes` fields

`alosHashachar`, `tefillin` (misheyakir), `netzHachama` (sunrise), `sofZmanShemaMGA`, `kriasShema`, `tefila`, `chatzos`, `minchaGedola`, `plagHamincha`, `shkiah`, `shkiahElevated`, `tzesHakochavim`, `tzeisRT` (Rabbeinu Tam), `shabbosEnter` / `shabbosEnterUnix`, `shabbosExit` / `shabbosExitUnix`, `isShabbat`, `isYomTov`, `DST`, `date`.

Times are returned as `"H:MM:SS"` strings in the location's local time; the `*Unix` fields are epoch seconds; `isShabbat` and `isYomTov` are booleans (see [Shabbat & Yom Tov status](#shabbat--yom-tov-status)).

## Development

```bash
yarn test --run   # run the test suite (285 tests, 17 cities across 6 countries)
yarn typecheck    # type-check
yarn build        # bundle to dist/ (dual CJS + ESM)
```

## Credits

Credit to Yitzhak Cohen for his great work, without him this would not be possible.

## License

MIT
