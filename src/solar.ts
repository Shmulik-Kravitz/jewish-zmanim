// Jean Meeus solar position algorithm for high-precision zmanim calculations

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export function julianDay(year: number, month: number, day: number): number {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

export function julianCentury(jd: number): number {
  return (jd - 2451545.0) / 36525.0;
}

function sunMeanLong(T: number): number {
  return ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
}

function sunMeanAnomaly(T: number): number {
  return ((357.52911 + T * (35999.05029 - T * 0.0001537)) % 360 + 360) % 360;
}

function eccentricity(T: number): number {
  return 0.016708634 - T * (0.000042037 + T * 0.0000001267);
}

function sunEqOfCenter(T: number): number {
  const M = sunMeanAnomaly(T) * D2R;
  return Math.sin(M) * (1.914602 - T * (0.004817 + T * 0.000014))
    + Math.sin(2 * M) * (0.019993 - T * 0.000101)
    + Math.sin(3 * M) * 0.000289;
}

function sunApparentLong(T: number): number {
  const omega = 125.04 - 1934.136 * T;
  return sunMeanLong(T) + sunEqOfCenter(T) - 0.00569 - 0.00478 * Math.sin(omega * D2R);
}

function obliquityCorr(T: number): number {
  const sec = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813));
  const meanObliq = 23 + (26 + sec / 60) / 60;
  const omega = 125.04 - 1934.136 * T;
  return meanObliq + 0.00256 * Math.cos(omega * D2R);
}

export function solarDeclination(T: number): number {
  return Math.asin(Math.sin(obliquityCorr(T) * D2R) * Math.sin(sunApparentLong(T) * D2R)) * R2D;
}

export function equationOfTime(T: number): number {
  const obliq = obliquityCorr(T) * D2R;
  const L0 = sunMeanLong(T) * D2R;
  const e = eccentricity(T);
  const M = sunMeanAnomaly(T) * D2R;
  let y = Math.tan(obliq / 2);
  y *= y;
  const eot = y * Math.sin(2 * L0) - 2 * e * Math.sin(M)
    + 4 * e * y * Math.sin(M) * Math.cos(2 * L0)
    - 0.5 * y * y * Math.sin(4 * L0) - 1.25 * e * e * Math.sin(2 * M);
  return 4 * eot * R2D; // minutes
}

export function hourAngleDeg(lat: number, dec: number, zenith: number): number {
  const latRad = lat * D2R;
  const decRad = dec * D2R;
  const zenRad = zenith * D2R;

  const denom = Math.cos(latRad) * Math.cos(decRad);
  // When the denominator is (numerically) zero, the geometry is undefined
  // (e.g. observer at the pole with dec≈0 and zenith≈90°). Treat this as
  // "no solution" and return NaN so callers can handle impossible geometry.
  if (Math.abs(denom) < 1e-12) return NaN;

  const cosHA = (Math.cos(zenRad) - Math.sin(latRad) * Math.sin(decRad)) / denom;
  if (Math.abs(cosHA) > 1) return NaN;
  return Math.acos(cosHA) * R2D;
}

/** Geometric dip angle in degrees for observer at height h meters */
export function elevationDip(h: number): number {
  if (h <= 0) return 0;
  return Math.acos(6371000 / (6371000 + h)) * R2D;
}

/** Atmospheric pressure at elevation h (meters) in hPa */
export function pressureAtElevation(h: number): number {
  return 1013.25 * Math.pow(1 - 2.25577e-5 * h, 5.25588);
}

/** Standard zenith for sunrise/sunset, with refraction adjusted for elevation.
 *  At sea level: 90° + 16' (semi-diameter) + 34' (refraction) = 90°50'.
 *  At higher elevations, atmospheric pressure is lower → less refraction. */
export function sunriseZenith(h: number): number {
  const semiDiameter = 16 / 60; // 0.2667°
  const seaLevelRefraction = 34 / 60; // 0.5667°
  if (h <= 0) return 90 + semiDiameter + seaLevelRefraction;
  const pressureRatio = pressureAtElevation(h) / 1013.25;
  return 90 + semiDiameter + seaLevelRefraction * pressureRatio;
}

/** Zenith for "elevated h/0" calculation (observer at h, horizon at sea level) */
export function elevatedZenith(h: number): number {
  return 90 + 50 / 60 + elevationDip(h);
}

export interface SunTimesResult {
  sunrise: number; // decimal hours local time
  sunset: number;
}

export function calcSunTimes(
  year: number, month: number, day: number,
  lat: number, lon: number, tz: number,
  zenith: number
): SunTimesResult {
  const jd = julianDay(year, month, day);

  // First pass: compute at local solar noon
  const approxNoonUT = 12 - tz - lon / 15;
  const T0 = julianCentury(jd + approxNoonUT / 24);
  const eot0 = equationOfTime(T0);
  const dec0 = solarDeclination(T0);
  const ha0 = hourAngleDeg(lat, dec0, zenith);
  if (isNaN(ha0)) return { sunrise: NaN, sunset: NaN };
  const noon0 = 720 - 4 * lon - eot0 + tz * 60;
  const rise0 = (noon0 - ha0 * 4) / 60;
  const set0 = (noon0 + ha0 * 4) / 60;

  // Second pass: refine at actual event times
  const riseUT = rise0 - tz;
  const Tr = julianCentury(jd + riseUT / 24);
  const eotR = equationOfTime(Tr);
  const decR = solarDeclination(Tr);
  const haR = hourAngleDeg(lat, decR, zenith);

  const setUT = set0 - tz;
  const Ts = julianCentury(jd + setUT / 24);
  const eotS = equationOfTime(Ts);
  const decS = solarDeclination(Ts);
  const haS = hourAngleDeg(lat, decS, zenith);

  if (isNaN(haR) || isNaN(haS)) return { sunrise: rise0, sunset: set0 };

  const noonR = 720 - 4 * lon - eotR + tz * 60;
  const noonS = 720 - 4 * lon - eotS + tz * 60;

  return {
    sunrise: (noonR - haR * 4) / 60,
    sunset: (noonS + haS * 4) / 60,
  };
}
