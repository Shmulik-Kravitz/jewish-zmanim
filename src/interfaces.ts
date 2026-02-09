export interface CoordinateOptions {
  timezoneName?: string;           // IANA timezone (e.g. "Asia/Jerusalem") – auto-detected if omitted
  elevation?: number;              // meters above sea level
  candleMinutes?: number;          // minutes before sunset for candle lighting (auto-detected for Israel)
  tefillinDeg?: number;            // degrees below horizon for tefillin
}

export interface CityRow {
  latitude: number;
  longitude: number;
  country_en: string;
  city_en?: string;
  tz_name?: string;
  more?: string;
  elevation?: number;
}

export interface CityInfo {
  latitude: number;
  longitude: number;
  country: string;
  city: string;
  timezone: number;
  dst: boolean;
  min: number;
  elevation?: number;
  tefillinDeg?: number; // degrees below horizon for tefillin (default: Israel 11.5, others 10.2)
}

export interface SunCalcResult {
  sunrise: string;
  sunrise_num: number;
  sunset: string;
  sunset_num: number;
}

export interface ChabadZmanim {
  alos72: string;
  misheyakir: string;
  netzHachama: string;
  sofZmanShemaGra: string;
  sofZmanShemaAR: string;
  sofZmanTefilaGra: string;
  sofZmanTefilaAR: string;
  chatzot: string;
  minchaGedola: string;
  minchaKetana: string;
  plagHamincha: string;
  shkiah: string;
  tzeis: string;
  tzeisRT: string;
  chatzotLayla: string;
}


export interface TimezoneResult {
  timezoneName: string;   // IANA timezone name (e.g. "Asia/Jerusalem")
  offset: number;         // UTC offset in hours for the given date (e.g. 2 or 3)
  dst: boolean;           // Is DST active on the given date?
  dstLabel: string;       // "שעון קיץ" / "שעון חורף" / "Summer" / "Winter"
}