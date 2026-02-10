# Zmanim – ספריית זמנים הלכתיים

ספריית TypeScript מקיפה לחישוב זמנים הלכתיים


---

## Overview – סקירה כללית

### What's Included

| # | Feature | Description | Key Method |
|---|---------|-------------|------------|
| 1 | **Zmanim** | כל הזמנים ההלכתיים – הנץ, שקיעה, ק"ש, תפילה, חצות, מנחה, פלג, צאת. אלגוריתם Jean Meeus עם תמיכה בגובה | `times.*` |


### Accuracy & Verification

| Metric | Value |
|--------|-------|
| Solar algorithm | Jean Meeus (solar position with iterative refinement) |
| Tested cities | 17 cities across 6 countries, both hemispheres |
| Sunrise/sunset | |
| Alos/tefillin/chatzot/tzeis | |


### Table of Contents

| | Section | What It Covers |
|---|---------|----------------|
| | [Quick Start](#quick-start) | Basic zmanim usage with CityInfo |
| 1 | [Chabad Zmanim](#1-chabad-zmanim-baal-hatanya--alter-rebbe) | Alter Rebbe times, GRA comparison |
| 2 | [Auto Timezone](#2-auto-timezone--fromcoordinates) | Coordinates → timezone + DST |
| | [Project Structure](#project-structure) | Source files overview |
| | [CityInfo Configuration](#cityinfo-configuration) | Location setup |
| | [API Reference](#api-reference) | Full method tables |

## Installation

```bash
npm install zmanim
```
Or

```bash
yarn add zmanim
```

## Quick Start

```typescript
import { Zmanim, CityInfo } from 'zmanim';

const jerusalem: CityInfo = {
  latitude: 31.7683,
  longitude: 35.2137,
  country: 'Israel',
  city: 'Jerusalem',
  timezone: 2,
  dst: false,
  min: 40,        // candle lighting minutes before sunset
  elevation: 650, // meters above sea level (optional)
};

// constructor signature:
// new Zmanim(cityInfo: CityInfo, date?: Date)
const z = new Zmanim(jerusalem, new Date('2026-02-08'));

// Standard zmanim
console.log(z.times.alosHashachar);  // "5:13:47"  עלות השחר (16.1°)
console.log(z.times.tefillin);       // "5:35:42"  משיכיר (11.5°)
console.log(z.times.netzHachama);    // "6:27:24"  הנץ החמה
console.log(z.times.kriasShema);     // "9:10:27"  סוף זמן ק"ש (גר"א)
console.log(z.times.chatzos);        // "11:53:31" חצות היום
console.log(z.times.minchaGedola);   // "12:23:31" מנחה גדולה
console.log(z.times.manchKtana);     // "15:04:30" מנחה קטנה
console.log(z.times.plagHamincha);   // "16:11:40" פלג המנחה
console.log(z.times.shkiah);         // "17:19:38" שקיעה
console.log(z.times.tzesHakochavim); // "17:56:56" צאת הכוכבים (8.5°)
console.log(z.times.shabbosEnter);   // "16:48:xx" הדלקת נרות (40 דקות)
console.log(z.times.shabbosExit);    // "18:01:xx" מוצאי שבת
```

## 1. Chabad Zmanim (Baal HaTanya / Alter Rebbe)

Calculates zmanim according to the Alter Rebbe's (Baal HaTanya) method:
- **Alos HaShachar** – 72 fixed minutes before sunrise
- **Shaah Zmanit (AR)** – From Alos 72 to Tzeis 72, divided by 12
- **Sof Zman Shema / Tefila (AR)** – Based on Alter Rebbe's shaah zmanit
- **Tzeis Rabbenu Tam** – 72 fixed minutes after sunset
- **Chatzot Layla** – Midpoint between sunset and next sunrise

### Weekday Example

```typescript
const jerusalem: CityInfo = {
  latitude: 31.7683, longitude: 35.2137,
  country: 'Israel', city: 'Jerusalem',
  timezone: 2, dst: false, min: 40,
  elevation: 800,
};

const z = new Zmanim(jerusalem, new Date('2026-02-10')); // Tuesday, 22 Shevat 5786
const chabad = z.getChabadZmanim();

// ── Morning (Shacharit) ──
console.log(chabad.alos72);          // עלות השחר – 72 min before sunrise
console.log(chabad.misheyakir);      // משיכיר – earliest tallit & tefillin
console.log(chabad.netzHachama);     // הנץ החמה – sunrise

// ── Shema & Tefila ──
console.log(chabad.sofZmanShemaGra); // סוף זמן ק"ש (גר"א)
console.log(chabad.sofZmanShemaAR);  // סוף זמן ק"ש (בעל התניא)
console.log(chabad.sofZmanTefilaGra);// סוף זמן תפילה (גר"א)
console.log(chabad.sofZmanTefilaAR); // סוף זמן תפילה (בעל התניא)

// ── Midday & Mincha ──
console.log(chabad.chatzot);         // חצות היום
console.log(chabad.minchaGedola);    // מנחה גדולה – earliest Mincha
console.log(chabad.minchaKetana);    // מנחה קטנה
console.log(chabad.plagHamincha);    // פלג המנחה

// ── Evening (Maariv) ──
console.log(chabad.shkiah);          // שקיעה – sunset
console.log(chabad.tzeis);           // צאת הכוכבים (8.5°)
console.log(chabad.tzeisRT);         // צאת רבינו תם (72 דקות)
console.log(chabad.chatzotLayla);    // חצות הלילה
```

### GRA vs. Alter Rebbe (Baal HaTanya) Comparison

The key difference is how **shaah zmanit** (halachic hour) is calculated:

| | GRA (Vilna Gaon) | Alter Rebbe (Baal HaTanya) |
|---|---|---|
| **Day starts** | Sunrise (הנץ) | Alos 72 (עלות 72 דקות) |
| **Day ends** | Sunset (שקיעה) | Tzeis 72 (צאת 72 דקות) |
| **Shaah Zmanit** | (sunset − sunrise) / 12 | (tzeis72 − alos72) / 12 |
| **Sof Zman Shema** | 3 hours from sunrise | 3 hours from alos 72 |
| **Sof Zman Tefila** | 4 hours from sunrise | 4 hours from alos 72 |

```typescript
const z = new Zmanim(jerusalem, '2026-06-21'); // Summer solstice
const chabad = z.getChabadZmanim();

// GRA – later Shema (shorter halachic hour, starts at sunrise)
console.log(chabad.sofZmanShemaGra);  // e.g. "9:12:xx"

// Alter Rebbe – earlier Shema (longer halachic hour, starts 72 min before sunrise)
console.log(chabad.sofZmanShemaAR);   // e.g. "9:01:xx"

// In summer, the difference is smaller because days are longer.
// In winter, the Alter Rebbe's Shema is noticeably earlier.
```

> **Note:** `getChabadZmanim()` returns both GRA and Alter Rebbe times in a single call, so you can display both opinions side by side.

### `ChabadZmanim` Fields Reference

| Field | Type | Description |
|-------|------|-------------|
| `alos72` | `string` | עלות 72 דקות שוות |
| `misheyakir` | `string` | משיכיר (ציצית ותפילין) |
| `netzHachama` | `string` | הנץ החמה |
| `sofZmanShemaGra` | `string` | סוף זמן ק"ש (גר"א) |
| `sofZmanShemaAR` | `string` | סוף זמן ק"ש – אדמו"ר הזקן |
| `sofZmanTefilaGra` | `string` | סוף זמן תפילה (גר"א) |
| `sofZmanTefilaAR` | `string` | סוף זמן תפילה – אדמו"ר הזקן |
| `chatzot` | `string` | חצות היום |
| `minchaGedola` | `string` | מנחה גדולה |
| `minchaKetana` | `string` | מנחה קטנה |
| `plagHamincha` | `string` | פלג המנחה |
| `shkiah` | `string` | שקיעה |
| `tzeis` | `string` | צאת הכוכבים (8.5°) |
| `tzeisRT` | `string` | צאת רבינו תם (72 דקות) |
| `chatzotLayla` | `string` | חצות הלילה |

## 2. Auto Timezone – `fromCoordinates()`

Create a Zmanim instance from **coordinates only** – timezone and DST are detected automatically.

```typescript
import { Zmanim } from 'zmanim';

// Just lat/lng + date – that's it!
const z = Zmanim.fromCoordinates(29.5577, 34.9519, new Date('2026-02-13'));

console.log(z.timezoneInfo.timezoneName); // "Asia/Jerusalem"
console.log(z.timezoneInfo.offset);       // 2 (IST)
console.log(z.timezoneInfo.dst);          // false
console.log(z.timezoneInfo.dstLabel);     // "שעון חורף"

// Summer – DST auto-detected:
const summer = Zmanim.fromCoordinates(29.5577, 34.9519, new Date('2026-07-15'));
console.log(summer.timezoneInfo.offset);  // 3 (IDT)
console.log(summer.timezoneInfo.dstLabel); // "שעון קיץ"

// Works worldwide:
const ny = Zmanim.fromCoordinates(40.6782, -73.9442, new Date('2026-02-13'));
console.log(ny.timezoneInfo.timezoneName); // "America/New_York"
console.log(ny.timezoneInfo.offset);       // -5 (EST)

// Override timezone if needed:
const custom = Zmanim.fromCoordinates(29.5577, 34.9519, new Date('2026-02-13'), {
  timezoneName: 'Europe/London',
  elevation: 100,
  candleMinutes: 18,
});
```

**Options:**
- `timezoneName` – IANA timezone override (auto-detected if omitted)
- `elevation` – meters above sea level (default 0)
- `candleMinutes` – candle lighting minutes (auto: Jerusalem 40, Israel 30, diaspora 18)
- `tefillinDeg` – degrees below horizon for tefillin

**Supported regions** (auto-detection): Israel, US, Canada, UK, France, Germany, Italy, Spain, Greece, Poland, Hungary, Nordics, Baltics, Russia, Turkey, Australia, South Africa, UAE, India, China, Japan, Brazil, Argentina, Morocco.

## Project Structure

```
src/
├── index.ts           # Re-exports Zmanim class and interfaces
├── zmanim.ts          # Main Zmanim class with all methods
├── interfaces.ts      # TypeScript interfaces (CityInfo, ChabadZmanim, etc.)
├── timezone.ts        # Auto timezone from coordinates, DST detection
└── solar.ts           # Solar position calculations (Meeus)
```

## CityInfo Configuration

```typescript
interface CityInfo {
  latitude: number;    // Decimal degrees (positive = North)
  longitude: number;   // Decimal degrees (positive = East)
  country: string;     // "Israel" enables Israel-specific defaults
  city: string;        // City name
  timezone: number;    // Effective UTC offset (including DST if active)
  dst: boolean;        // Is DST currently active? (informational)
  min: number;         // Candle lighting minutes before sunset
  elevation?: number;  // Meters above sea level (default: 0)
  tefillinDeg?: number; // Degrees below horizon for misheyakir
}
```

**Candle lighting defaults:**
- Jerusalem: 40 minutes
- Haifa / other Israeli cities: 30 minutes
- Diaspora: 18 minutes

**Tefillin degrees defaults:**
- Israel: 11.5°
- Diaspora: 10.2°

## API Reference

### Static Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `Zmanim.fromCoordinates(lat, lng, date, opts?)` | `Zmanim & { timezoneInfo }` | Auto timezone + DST from coordinates |
| `Zmanim.getCityInfoByRow(row, dateStr)` | `CityInfo` | Build CityInfo from a CityRow |
| `Zmanim.getTimezoneName(cityInfo)` | `string` | Resolve timezone name from CityRow |
| `Zmanim.isJerusalem(row)` | `boolean` | Check if CityRow is Jerusalem |
| `Zmanim.isHaifa(row)` | `boolean` | Check if CityRow is Haifa |
| `Zmanim.isIsrael(row)` | `boolean` | Check if CityRow is in Israel |

### Instance Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getDayOfWeek()` | `number` | 0=Sunday .. 6=Saturday |
| `getChabadZmanim()` | `ChabadZmanim` | Chabad-specific zmanim (Alter Rebbe) |
| `getTimes()` | `Record<string, any>` | Cleaned times (removes internal fields) |
| `calcTimes(sundeg?, sunmin?)` | `SunCalcResult` | Calculate sun times for custom zenith |
| `toTime(V, func?)` | `string` | Convert decimal hours to "H:MM:SS" |
| `toUnixTimestamp(V)` | `number` | Convert decimal hours to Unix timestamp |

### Instance Properties

| Property | Type | Description |
|----------|------|-------------|
| `times.alosHashachar` | `string` | עלות השחר (16.1°) |
| `times.tefillin` | `string` | משיכיר / earliest tefillin |
| `times.netzHachama` | `string` | הנץ החמה – sunrise |
| `times.kriasShema` | `string` | סוף זמן ק"ש (גר"א) |
| `times.tefila` | `string` | סוף זמן תפילה (גר"א) |
| `times.chatzos` | `string` | חצות היום |
| `times.minchaGedola` | `string` | מנחה גדולה |
| `times.manchKtana` | `string` | מנחה קטנה |
| `times.plagHamincha` | `string` | פלג המנחה |
| `times.shkiah` | `string` | שקיעה – sunset |
| `times.tzesHakochavim` | `string` | צאת הכוכבים (8.5°) |
| `times.shabbosEnter` | `string` | הדלקת נרות – candle lighting |
| `times.shabbosExit` | `string` | מוצאי שבת |

### Exported Types

| Type | Description |
|------|-------------|
| `CityInfo` | Location configuration for Zmanim constructor |
| `CityRow` | Raw city row data (for `getCityInfoByRow`) |
| `ChabadZmanim` | Return type of `getChabadZmanim()` |
| `CoordinateOptions` | Options for `fromCoordinates()` |
| `SunCalcResult` | Return type of `calcTimes()` |
| `TimezoneResult` | Timezone info returned by `fromCoordinates()` |

## Testing

```bash
yarn test
```

## License

MIT
