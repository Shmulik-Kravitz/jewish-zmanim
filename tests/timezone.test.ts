import { describe, it, assert } from 'vitest';
import {
  guessTimezoneName,
  getTimezoneInfoFromName,
  resolveTimezone,
  getTimezoneInfo,
} from '../src/timezone';

describe('guessTimezoneName', () => {
  it('returns Asia/Jerusalem for coordinates in Israel', () => {
    const tz = guessTimezoneName(31.7683, 35.2137); // Jerusalem
    assert.equal(tz, 'Asia/Jerusalem');
  });

  it('returns America/New_York for coordinates in US east coast', () => {
    const tz = guessTimezoneName(40.7128, -74.006); // New York
    assert.equal(tz, 'America/New_York');
  });

  it('returns null for coordinates outside known regions', () => {
    const tz = guessTimezoneName(0, 0); // Atlantic ocean
    assert.equal(tz, null);
  });
});

describe('getTimezoneInfoFromName', () => {
  it('detects standard time and DST correctly for Asia/Jerusalem', () => {
    const winter = getTimezoneInfoFromName('2026-02-13', 'Asia/Jerusalem');
    assert.equal(winter.offset, 2);
    assert.equal(winter.dst, false);
    assert.equal(winter.dstLabel, 'שעון חורף');

    const summer = getTimezoneInfoFromName('2026-07-15', 'Asia/Jerusalem');
    assert.equal(summer.offset, 3);
    assert.equal(summer.dst, true);
    assert.equal(summer.dstLabel, 'שעון קיץ');
  });

  it('detects standard time and DST correctly for America/New_York', () => {
    const winter = getTimezoneInfoFromName('2026-02-13', 'America/New_York');
    assert.equal(winter.offset, -5);
    assert.equal(winter.dst, false);
    assert.equal(winter.dstLabel, 'Standard Time');

    const summer = getTimezoneInfoFromName('2026-07-15', 'America/New_York');
    assert.equal(summer.offset, -4);
    assert.equal(summer.dst, true);
    assert.equal(summer.dstLabel, 'Summer Time');
  });
});

describe('resolveTimezone', () => {
  it('resolves timezone from coordinates when timezoneName is omitted', () => {
    const info = resolveTimezone(31.7683, 35.2137, '2026-02-13');
    assert.equal(info.timezoneName, 'Asia/Jerusalem');
    assert.equal(info.offset, 2);
    assert.equal(info.dst, false);
  });

  it('uses explicit timezoneName even if coordinates map elsewhere', () => {
    const info = resolveTimezone(31.7683, 35.2137, '2026-02-13', 'America/New_York');
    assert.equal(info.timezoneName, 'America/New_York');
    assert.equal(info.offset, -5);
  });

  it('throws when timezone cannot be determined and no timezoneName provided', () => {
    assert.throws(() => resolveTimezone(0, 0, '2026-02-13'));
  });
});

describe('getTimezoneInfo (legacy helper)', () => {
  it('returns correct offset and dst for Asia/Jerusalem winter vs summer', () => {
    const winter = getTimezoneInfo('2026-02-13', 'Asia/Jerusalem');
    assert.equal(winter.offset, 2);
    assert.equal(winter.dst, false);

    const summer = getTimezoneInfo('2026-07-15', 'Asia/Jerusalem');
    assert.equal(summer.offset, 3);
    assert.equal(summer.dst, true);
  });

  it('returns correct offset and dst for America/New_York winter vs summer', () => {
    const winter = getTimezoneInfo('2026-02-13', 'America/New_York');
    assert.equal(winter.offset, -5);
    assert.equal(winter.dst, false);

    const summer = getTimezoneInfo('2026-07-15', 'America/New_York');
    assert.equal(summer.offset, -4);
    assert.equal(summer.dst, true);
  });
});

