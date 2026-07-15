import type {
  CityInfo,
  CityRow,
  CoordinateOptions,
  TimezoneResult,
  ZmanimTimes,
} from './interfaces';

import { isErevShabbat, isErevYomTov, isShabbat, isYomTov } from 'jewish-holidays';
import { elevatedZenith, calcSunTimes as meeusCalc, sunriseZenith } from './solar';
import { getTimezoneInfo, resolveTimezone } from './timezone';

export class Zmanim {
  public latitude: number;
  public longitude: number;
  public country: string;
  public city: string;
  public timezone: number;
  public DST: boolean;
  public elevation: number;
  private times: Record<string, number | string | boolean>;

  private mon: number;
  private mday: number;
  private year: number;
  private shabatmin: number;

  constructor(cityInfo: CityInfo, date?: Date) {
    const d = date ?? new Date();
    this.year = d.getFullYear();
    this.mon = d.getMonth() + 1;
    this.mday = d.getDate();

    const dateStr = `${this.year}-${String(this.mon).padStart(2, '0')}-${String(this.mday).padStart(2, '0')} 12:00:00`;

    this.shabatmin = cityInfo.min;
    this.latitude = cityInfo.latitude;
    this.longitude = cityInfo.longitude;
    this.country = cityInfo.country;
    this.city = cityInfo.city;
    this.timezone = cityInfo.timezone;
    this.DST = cityInfo.dst;
    this.elevation = cityInfo.elevation || 0;

    // Alos HaShachar (dawn) - 16.1° below horizon
    const alosResult = this.sunTimes(106.1);
    const alot = this.toTime(alosResult.sunrise);

    // Misheyakir (tefillin) - configurable degrees below horizon
    const tefillinDeg = cityInfo.tefillinDeg ?? (this.isIsraelCity() ? 11.5 : 10.2);
    const tefillinResult = this.sunTimes(90 + tefillinDeg);
    const mishyakir = this.toTime(tefillinResult.sunrise);

    // Standard sunrise/sunset - with elevation-adjusted refraction
    const stdZenith = sunriseZenith(this.elevation);
    const std = this.sunTimes(stdZenith);

    this.times = {};
    this.times.sunrise = this.toTime(std.sunrise);
    this.times.sunrise_num = std.sunrise;
    this.times.sunset = this.toTime(std.sunset);
    this.times.sunset_num = std.sunset;

    this.times.shaa_zmanit = (std.sunset - std.sunrise) / 12;
    this.times.alosHashachar = alot;
    this.times.tefillin = mishyakir;
    this.times.netzHachama = this.times.sunrise;

    this.times.kriasShema = this.toTime(std.sunrise + this.times.shaa_zmanit * 3, 'floor');
    this.times.tefila = this.toTime(std.sunrise + this.times.shaa_zmanit * 4, 'floor');
    this.times.chatzos = this.toTime(std.sunrise + this.times.shaa_zmanit * 6);

    this.times.minchaGedolaGra = this.toTime(
      std.sunrise + this.times.shaa_zmanit * 6 + this.times.shaa_zmanit / 2
    );
    const shaa = Math.max(1, this.times.shaa_zmanit);
    this.times.minchaGedola = this.toTime(std.sunrise + this.times.shaa_zmanit * 6 + shaa / 2);

    this.times.manchKtana = this.toTime(std.sunrise + this.times.shaa_zmanit * 9.5);
    this.times.plagHamincha = this.toTime(std.sunrise + this.times.shaa_zmanit * 10.75, 'floor');
    this.times.shkiah = this.times.sunset;

    // Tzes Hakochavim - 8.5° below horizon (~36 min as degrees)
    const tzeitResult = this.sunTimes(98.5);
    this.times.tzesHakochavim = this.toTime(tzeitResult.sunset);

    // Chabad / Alter Rebbe calculations
    // Alos 72 - 72 fixed minutes before sunrise
    const alos72 = std.sunrise - 72 / 60;
    this.times.alos72 = this.toTime(alos72);

    // Shaah zmanit MGA: from alos72 to tzeis RT flat (sunrise-72 to sunset+72) / 12
    const tzeisRTflat = std.sunset + 72 / 60;
    const shaaMGA = (tzeisRTflat - alos72) / 12;

    // Shema & Tefila according to Alter Rebbe (MGA)
    this.times.sofZmanShemaMGA = this.toTime(alos72 + shaaMGA * 3, 'floor');
    this.times.sofZmanTefilaMGA = this.toTime(alos72 + shaaMGA * 4, 'floor');

    // Tzeis Rabbenu Tam: elevated sunset + 72 min
    const elevZenith = elevatedZenith(this.elevation);
    const elevStd = this.sunTimes(elevZenith);
    this.times.shkiahElevated = this.toTime(elevStd.sunset);
    this.times.tzeisRT = this.toTime(elevStd.sunset + 72 / 60);

    // Chatzot HaLayla - midpoint between sunset and next sunrise
    const tomorrow = new Date(this.year, this.mon - 1, this.mday + 1);
    const nextStd = this.sunTimes(
      stdZenith,
      tomorrow.getFullYear(),
      tomorrow.getMonth() + 1,
      tomorrow.getDate()
    );
    const nightDuration = 24 - std.sunset + nextStd.sunrise;
    let chatzotLayla = std.sunset + nightDuration / 2;
    if (chatzotLayla >= 24) chatzotLayla -= 24;
    this.times.chatzotLayla = this.toTime(chatzotLayla);

    this.shabes();

    // Jewish calendar flags for the given date (jewish-holidays package).
    // isChutzLaaretz is true for the diaspora (non-Israel) so festival second days count.
    // The reference moment is the time-of-day of the input `date` (a date-only input at
    // midnight therefore reports the plain calendar-day value).
    const chutzLaaretz = !this.isIsraelCity();
    const gregorian = new Date(this.year, this.mon - 1, this.mday);
    const refHours = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;

    // Shabbat/Yom Tov begin at candle-lighting on the erev and end at tzeis (nightfall).
    // Candle-lighting is today's (elevated) sunset minus the candle-lighting offset — on a
    // Friday this equals shabbosEnter, and it is likewise correct on any Erev Yom Tov.
    const beforeTzeis = refHours < tzeitResult.sunset;
    const afterCandleLighting = refHours >= elevStd.sunset - this.shabatmin / 60;

    this.times.isShabbat =
      (isShabbat(gregorian) && beforeTzeis) || (isErevShabbat(gregorian) && afterCandleLighting);

    // A Yom Tov whose next day is also Yom Tov (2-day festivals, diaspora second days)
    // does not end at its own tzeis — it runs on into the night, so skip the tzeis gate.
    const yomTovToday = isYomTov(gregorian, chutzLaaretz);
    const yomTovContinuesTonight = isYomTov(tomorrow, chutzLaaretz);
    this.times.isYomTov =
      (yomTovToday && (yomTovContinuesTonight || beforeTzeis)) ||
      (isErevYomTov(gregorian) && afterCandleLighting);

    this.times.DST = this.DST;
    this.times.date = dateStr;
  }

  /** Calculate sunrise/sunset for a given zenith angle using Meeus algorithm */
  private sunTimes(
    zenith: number,
    year?: number,
    month?: number,
    day?: number
  ): { sunrise: number; sunset: number } {
    const y = year ?? this.year;
    const m = month ?? this.mon;
    const d = day ?? this.mday;
    let tz = this.timezone;
    if (tz === 13) tz = -11;
    return meeusCalc(y, m, d, this.latitude, this.longitude, tz, zenith);
  }

  private static getTimezoneName(cityInfo: CityRow): string {
    if (cityInfo.tz_name) {
      return cityInfo.tz_name;
    }
    if (cityInfo.country_en === 'Israel') {
      return 'Israel';
    }
    return cityInfo.city_en || '';
  }

  static isJerusalem(row: CityRow): boolean {
    if (!row.city_en) return false;
    return (
      (row.country_en === 'Israel' && row.city_en === 'Jerusalem') ||
      (row.country_en === 'ישראל' && row.city_en === 'ירושלים')
    );
  }

  static isHaifa(row: CityRow): boolean {
    if (!row.city_en) return false;
    return (
      (row.country_en === 'Israel' && row.city_en === 'haifa') ||
      (row.country_en === 'ישראל' && row.city_en === 'חיפה')
    );
  }

  static isIsrael(row: CityRow): boolean {
    return row.country_en === 'Israel' || row.country_en === 'ישראל';
  }

  private isIsraelCity(): boolean {
    return this.country === 'Israel' || this.country === 'ישראל';
  }

  // ─── Calendar Methods ────────────────────────────────────────────────

  // ─── Calendar Methods ────────────────────────────────────────────────

  /**
   * יצירת Zmanim מקואורדינטות בלבד – timezone ו-DST מחושבים אוטומטית.
   * @param lat Latitude
   * @param lng Longitude
   * @param date Date object
   * @param options Optional: timezoneName, elevation, candleMinutes, tefillinDeg
   */
  static fromCoordinates(
    lat: number,
    lng: number,
    date: Date,
    options?: CoordinateOptions
  ): Zmanim & { timezoneInfo: TimezoneResult } {
    if (lat < -90 || lat > 90) {
      throw new RangeError(`Latitude must be between -90 and 90, got ${lat}`);
    }
    if (lng < -180 || lng > 180) {
      throw new RangeError(`Longitude must be between -180 and 180, got ${lng}`);
    }
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      throw new TypeError('date must be a valid Date object');
    }
    if (options?.elevation !== undefined && options.elevation < 0) {
      throw new RangeError(`Elevation must be >= 0, got ${options.elevation}`);
    }
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const tz = resolveTimezone(lat, lng, dateStr, options?.timezoneName);

    // Auto-detect candle lighting minutes for Israel
    const isIsrael = lat >= 29 && lat <= 34 && lng >= 34 && lng <= 36;
    let min = options?.candleMinutes ?? 18;
    if (isIsrael && !options?.candleMinutes) {
      // Jerusalem area: 40 min, Haifa: 30 min, rest of Israel: 30 min
      if (lat >= 31.7 && lat <= 31.85 && lng >= 35.1 && lng <= 35.25) {
        min = 40; // Jerusalem
      } else {
        min = 30; // rest of Israel
      }
    }

    const cityInfo: CityInfo = {
      latitude: lat,
      longitude: lng,
      country: isIsrael ? 'Israel' : '',
      city: '',
      timezone: tz.offset,
      dst: tz.dst,
      min,
      elevation: options?.elevation ?? 0,
      tefillinDeg: options?.tefillinDeg,
      timezoneName: tz.timezoneName,
    };

    const z = new Zmanim(cityInfo, date) as Zmanim & { timezoneInfo: TimezoneResult };
    z.timezoneInfo = tz;
    return z;
  }

  private static getCityInfoByRow(row: CityRow, date: Date): CityInfo {
    const timezoneName = Zmanim.getTimezoneName(row);

    let timezoneOffset: number;
    let dst: boolean;

    try {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const info = getTimezoneInfo(dateStr, timezoneName);
      timezoneOffset = info.offset;
      dst = info.dst;
    } catch {
      timezoneOffset = 0;
      dst = false;
    }

    let min = 18;
    if (Zmanim.isJerusalem(row)) {
      min = 40;
    } else if (Zmanim.isHaifa(row)) {
      min = 30;
    } else if (Zmanim.isIsrael(row)) {
      min = 30;
    }

    return {
      latitude: row.latitude,
      longitude: row.longitude,
      city: row.city_en || '',
      country: row.country_en,
      timezone: timezoneOffset,
      dst,
      min,
      elevation: row.elevation || 0,
      timezoneName,
    };
  }

  private shabes(): void {
    // Find Friday (erev shabbat)
    // 6=Friday. dow is 0-6 (Sun-Sat).
    const dow = new Date(this.year, this.mon - 1, this.mday).getDay();
    const daysToFriday = (5 - dow + 7) % 7;
    // Current date object
    const current = new Date(this.year, this.mon - 1, this.mday);
    // Friday date
    const friday = new Date(current);
    friday.setDate(current.getDate() + daysToFriday);
    const fYear = friday.getFullYear();
    const fMonth = friday.getMonth() + 1;
    const fDay = friday.getDate();

    // Candle lighting uses "elevated" sunset (observer at elevation, horizon at sea level)
    const elevZenith = elevatedZenith(this.elevation);
    const fridaySunset = this.sunTimes(elevZenith, fYear, fMonth, fDay);
    const enterNum = fridaySunset.sunset - this.shabatmin / 60.0;
    this.times.shabbosEnter = this.toTime(enterNum);
    this.times.shabat_start_unix = this.toUnixTimestampFromDate(fYear, fMonth, fDay, enterNum);

    // Saturday - shabbos exit at tzeis (8.5° below horizon)
    const saturday = new Date(friday);
    saturday.setDate(friday.getDate() + 1);
    const sYear = saturday.getFullYear();
    const sMonth = saturday.getMonth() + 1;
    const sDay = saturday.getDate();

    const satTzeis = this.sunTimes(98.5, sYear, sMonth, sDay);
    this.times.shabbosExit = this.toTime(satTzeis.sunset);
    this.times.shabat_ends_unix = this.toUnixTimestampFromDate(
      sYear,
      sMonth,
      sDay,
      satTzeis.sunset
    );
  }

  public getTimes(): ZmanimTimes {
    return {
      alosHashachar: this.times.alosHashachar as string,
      tefillin: this.times.tefillin as string,
      netzHachama: this.times.netzHachama as string,
      kriasShema: this.times.kriasShema as string,
      sofZmanShemaMGA: this.times.sofZmanShemaMGA as string,
      tefila: this.times.tefila as string,
      chatzos: this.times.chatzos as string,
      minchaGedola: this.times.minchaGedola as string,
      plagHamincha: this.times.plagHamincha as string,
      shkiah: this.times.shkiah as string,
      shkiahElevated: this.times.shkiahElevated as string,
      tzesHakochavim: this.times.tzesHakochavim as string,
      tzeisRT: this.times.tzeisRT as string,
      shabbosEnter: this.times.shabbosEnter as string,
      shabbosEnterUnix: this.times.shabat_start_unix as number,
      shabbosExit: this.times.shabbosExit as string,
      shabbosExitUnix: this.times.shabat_ends_unix as number,
      isShabbat: this.times.isShabbat as boolean,
      isYomTov: this.times.isYomTov as boolean,
      DST: this.times.DST as boolean,
      date: this.times.date as string,
    };
  }

  static fromCityRow(row: CityRow, date: Date): Zmanim {
    return new Zmanim(Zmanim.getCityInfoByRow(row, date), date);
  }

  private toTime(V: number, func: 'ceil' | 'floor' = 'ceil'): string {
    let totalSeconds: number;
    if (func === 'ceil') {
      totalSeconds = Math.ceil(V * 3600);
    } else {
      totalSeconds = Math.floor(V * 3600);
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  private toUnixTimestampFromDate(year: number, month: number, day: number, V: number): number {
    const totalSeconds = Math.round(V * 3600);
    const hour = Math.floor(totalSeconds / 3600);
    const min = Math.floor((totalSeconds % 3600) / 60);
    const sec = totalSeconds % 60;
    const date = new Date(year, month - 1, day, hour, min, sec);
    return Math.floor(date.getTime() / 1000);
  }
}
