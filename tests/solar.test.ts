import { describe, it, assert } from 'vitest';
import {
  julianDay,
  julianCentury,
  solarDeclination,
  equationOfTime,
  hourAngleDeg,
  elevationDip,
  pressureAtElevation,
  sunriseZenith,
  elevatedZenith,
  calcSunTimes,
} from '../src/solar';

describe('solar core helpers', () => {
  it('julianDay and julianCentury match J2000 reference', () => {
    const jd = julianDay(2000, 1, 1); // 2000-01-01 00:00
    assert.closeTo(jd, 2451544.5, 1e-6);

    const T = julianCentury(2451545.0); // exactly J2000.0
    assert.closeTo(T, 0, 1e-8);
  });

  it('solarDeclination and equationOfTime return reasonable ranges', () => {
    const jd = julianDay(2026, 2, 8);
    const T = julianCentury(jd);
    const dec = solarDeclination(T);
    const eot = equationOfTime(T);

    // declination must be between -90 and +90
    assert.ok(dec > -90 && dec < 90);
    // equation of time is typically within about ±20 minutes
    assert.ok(eot > -30 && eot < 30);
  });

  it('hourAngleDeg returns finite value for valid geometry and NaN when denominator blows up', () => {
    // Equatorial observer, declination 0, geometric horizon
    const haValid = hourAngleDeg(0, 0, 90);
    assert.ok(!Number.isNaN(haValid));
    assert.ok(haValid > 0 && haValid < 180);

    // At the pole with dec=0 and zenith 90°, denominator cos(lat)*cos(dec) = 0
    // → cosHA is infinite → |cosHA|>1 → function returns NaN
    const haInvalid = hourAngleDeg(90, 0, 90);
    assert.ok(Number.isNaN(haInvalid));
  });
});

describe('elevation and refraction helpers', () => {
  it('elevationDip is zero at/below sea level and positive above', () => {
    assert.equal(elevationDip(0), 0);
    assert.equal(elevationDip(-10), 0);
    assert.ok(elevationDip(1000) > 0);
  });

  it('pressureAtElevation decreases with height', () => {
    const sea = pressureAtElevation(0);
    const high = pressureAtElevation(3000);
    assert.closeTo(sea, 1013.25, 0.1);
    assert.ok(high < sea);
  });

  it('sunriseZenith adjusts refraction with elevation', () => {
    const sea = sunriseZenith(0);
    const high = sunriseZenith(2000);
    // sea-level value is 90°50' = 90.8333...
    assert.closeTo(sea, 90 + 50 / 60, 1e-4);
    // higher elevation -> less refraction -> slightly smaller zenith
    assert.ok(high < sea);
  });

  it('elevatedZenith adds geometric dip', () => {
    const sea = elevatedZenith(0);
    const high = elevatedZenith(1000);
    assert.closeTo(sea, 90 + 50 / 60, 1e-6);
    assert.ok(high > sea);
  });
});

describe('calcSunTimes', () => {
  it('returns reasonable sunrise/sunset for Jerusalem Feb 8 2026', () => {
    const year = 2026;
    const month = 2;
    const day = 8;
    const lat = 31.7683;
    const lon = 35.2137;
    const tz = 2;
    const zenith = sunriseZenith(650); // Jerusalem elevation ~650m

    const res = calcSunTimes(year, month, day, lat, lon, tz, zenith);

    // MyZmanim reference from other tests uses ~6:27 and ~17:19
    assert.ok(res.sunrise > 6 && res.sunrise < 7);
    assert.ok(res.sunset > 16.5 && res.sunset < 18);
  });

  it('returns NaN sunrise/sunset when geometry is impossible', () => {
    const res = calcSunTimes(2026, 2, 8, 0, 0, 0, 0); // zenith 0°
    assert.ok(Number.isNaN(res.sunrise));
    assert.ok(Number.isNaN(res.sunset));
  });
});

