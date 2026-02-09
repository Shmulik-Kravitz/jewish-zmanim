// ═══════════════════════════════════════════════════════════════════════════
// Automatic Timezone Resolution from Coordinates
// Uses IANA timezone names + Intl API for DST-aware offset calculation
// ═══════════════════════════════════════════════════════════════════════════

import type { TimezoneResult } from "./interfaces";


// ─── Coordinate → Timezone Mapping ───────────────────────────────────────────
// Covers major regions. For uncovered areas, user must supply timezoneName.

interface TzZone {
  latMin: number; latMax: number;
  lngMin: number; lngMax: number;
  tz: string;
}

const TZ_ZONES: TzZone[] = [
  // ── Israel ──
  { latMin: 29, latMax: 34, lngMin: 34, lngMax: 36, tz: 'Asia/Jerusalem' },

  // ── Europe ──
  { latMin: 49, latMax: 61, lngMin: -8, lngMax: 2, tz: 'Europe/London' },       // UK & Ireland
  { latMin: 42, latMax: 51.5, lngMin: -5, lngMax: 8, tz: 'Europe/Paris' },      // France, Belgium, Netherlands, Luxembourg
  { latMin: 46, latMax: 55, lngMin: 5, lngMax: 15, tz: 'Europe/Berlin' },       // Germany, Austria, Switzerland
  { latMin: 36, latMax: 47, lngMin: 6, lngMax: 19, tz: 'Europe/Rome' },         // Italy
  { latMin: 36, latMax: 44, lngMin: -10, lngMax: 4, tz: 'Europe/Madrid' },      // Spain, Portugal
  { latMin: 35, latMax: 42, lngMin: 19, lngMax: 30, tz: 'Europe/Athens' },      // Greece
  { latMin: 41, latMax: 45, lngMin: 19, lngMax: 30, tz: 'Europe/Bucharest' },   // Romania, Bulgaria
  { latMin: 49, latMax: 55, lngMin: 14, lngMax: 24, tz: 'Europe/Warsaw' },      // Poland
  { latMin: 47, latMax: 52, lngMin: 14, lngMax: 23, tz: 'Europe/Budapest' },    // Hungary, Czech, Slovakia
  { latMin: 55, latMax: 70, lngMin: 5, lngMax: 31, tz: 'Europe/Helsinki' },     // Nordics (Finland, Sweden, Norway)
  { latMin: 54, latMax: 58, lngMin: 20, lngMax: 29, tz: 'Europe/Vilnius' },     // Baltics

  // ── Russia (simplified – Moscow time for western Russia) ──
  { latMin: 50, latMax: 70, lngMin: 30, lngMax: 60, tz: 'Europe/Moscow' },

  // ── Turkey ──
  { latMin: 36, latMax: 42, lngMin: 26, lngMax: 45, tz: 'Europe/Istanbul' },

  // ── North America (note: for negative longitudes, lngMin < lngMax) ──
  { latMin: 25, latMax: 49, lngMin: -82, lngMax: -67, tz: 'America/New_York' },       // US Eastern
  { latMin: 25, latMax: 49, lngMin: -105, lngMax: -82, tz: 'America/Chicago' },       // US Central
  { latMin: 25, latMax: 49, lngMin: -115, lngMax: -105, tz: 'America/Denver' },       // US Mountain
  { latMin: 25, latMax: 49, lngMin: -125, lngMax: -115, tz: 'America/Los_Angeles' },  // US Pacific
  { latMin: 42, latMax: 56, lngMin: -80, lngMax: -53, tz: 'America/Toronto' },        // Eastern Canada
  { latMin: 45, latMax: 55, lngMin: -98, lngMax: -80, tz: 'America/Winnipeg' },       // Central Canada
  { latMin: 49, latMax: 55, lngMin: -130, lngMax: -110, tz: 'America/Vancouver' },    // Western Canada

  // ── South America ──
  { latMin: -35, latMax: -22, lngMin: -58, lngMax: -43, tz: 'America/Sao_Paulo' },    // Brazil (SE)
  { latMin: -40, latMax: -22, lngMin: -70, lngMax: -58, tz: 'America/Argentina/Buenos_Aires' },

  // ── Australia ──
  { latMin: -44, latMax: -28, lngMin: 140, lngMax: 154, tz: 'Australia/Sydney' },     // NSW, VIC
  { latMin: -28, latMax: -10, lngMin: 140, lngMax: 154, tz: 'Australia/Brisbane' },   // QLD
  { latMin: -38, latMax: -30, lngMin: 134, lngMax: 140, tz: 'Australia/Adelaide' },   // SA
  { latMin: -36, latMax: -12, lngMin: 114, lngMax: 134, tz: 'Australia/Perth' },      // WA

  // ── South Africa ──
  { latMin: -35, latMax: -22, lngMin: 16, lngMax: 33, tz: 'Africa/Johannesburg' },

  // ── UAE / Gulf ──
  { latMin: 22, latMax: 27, lngMin: 51, lngMax: 57, tz: 'Asia/Dubai' },

  // ── India ──
  { latMin: 8, latMax: 36, lngMin: 68, lngMax: 97, tz: 'Asia/Kolkata' },

  // ── China ──
  { latMin: 18, latMax: 54, lngMin: 73, lngMax: 135, tz: 'Asia/Shanghai' },

  // ── Japan ──
  { latMin: 24, latMax: 46, lngMin: 127, lngMax: 146, tz: 'Asia/Tokyo' },

  // ── Morocco ──
  { latMin: 27, latMax: 36, lngMin: -13, lngMax: -1, tz: 'Africa/Casablanca' },
];

/**
 * Guess IANA timezone name from latitude/longitude.
 * Returns null if coordinates don't match any known region.
 */
export function guessTimezoneName(lat: number, lng: number): string | null {
  for (const z of TZ_ZONES) {
    if (lat >= z.latMin && lat <= z.latMax && lng >= z.lngMin && lng <= z.lngMax) {
      return z.tz;
    }
  }
  return null;
}

/**
 * Get timezone info for a given date and IANA timezone name.
 * Uses Intl API for accurate DST detection.
 */
export function getTimezoneInfoFromName(
  dateStr: string,
  timezoneName: string
): TimezoneResult {
  const date = new Date(dateStr + 'T12:00:00Z'); // noon UTC to avoid date boundary issues

  // Calculate UTC offset for the given date
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' });
  const tzStr = date.toLocaleString('en-US', { timeZone: timezoneName });
  const utcDate = new Date(utcStr);
  const tzDate = new Date(tzStr);
  const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

  // Calculate January offset to determine DST
  const jan = new Date(date.getFullYear(), 0, 15, 12, 0, 0); // Jan 15 to avoid edge cases
  const utcJan = new Date(jan.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzJan = new Date(jan.toLocaleString('en-US', { timeZone: timezoneName }));
  const janOffset = (tzJan.getTime() - utcJan.getTime()) / (1000 * 60 * 60);

  // Also check July offset for southern hemisphere
  const jul = new Date(date.getFullYear(), 6, 15, 12, 0, 0);
  const utcJul = new Date(jul.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzJul = new Date(jul.toLocaleString('en-US', { timeZone: timezoneName }));
  const julOffset = (tzJul.getTime() - utcJul.getTime()) / (1000 * 60 * 60);

  // DST is active if current offset differs from the standard (winter) offset
  const standardOffset = Math.min(janOffset, julOffset);
  const dst = offset !== standardOffset;

  // Determine if this is an Israel timezone for Hebrew labels
  const isHebrew = timezoneName === 'Asia/Jerusalem';
  const dstLabel = dst
    ? (isHebrew ? 'שעון קיץ' : 'Summer Time')
    : (isHebrew ? 'שעון חורף' : 'Standard Time');

  return { timezoneName, offset, dst, dstLabel };
}

/**
 * Resolve timezone from coordinates + date.
 * If timezoneName is provided, uses it directly.
 * Otherwise, guesses from coordinates.
 * Throws if timezone cannot be determined.
 */
export function resolveTimezone(
  lat: number,
  lng: number,
  dateStr: string,
  timezoneName?: string
): TimezoneResult {
  const tzName = timezoneName || guessTimezoneName(lat, lng);
  if (!tzName) {
    throw new Error(
      `Cannot determine timezone for coordinates (${lat}, ${lng}). ` +
      `Please provide timezoneName parameter (e.g. "Asia/Jerusalem", "America/New_York").`
    );
  }
  return getTimezoneInfoFromName(dateStr, tzName);
}


export function getTimezoneInfo(
  dateStr: string,
  timeZone: string
): { offset: number; dst: boolean } {
  const date = new Date(dateStr);
  const utcDate = new Date(
    date.toLocaleString('en-US', { timeZone: 'UTC' })
  );
  const tzDate = new Date(
    date.toLocaleString('en-US', { timeZone })
  );
  const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);

  const jan = new Date(date.getFullYear(), 0, 1);
  const utcJan = new Date(
    jan.toLocaleString('en-US', { timeZone: 'UTC' })
  );
  const tzJan = new Date(
    jan.toLocaleString('en-US', { timeZone })
  );
  const janOffset = (tzJan.getTime() - utcJan.getTime()) / (1000 * 60 * 60);

  return { offset, dst: offset !== janOffset };
}
