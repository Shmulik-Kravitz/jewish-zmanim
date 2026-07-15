import { assert, describe, it } from 'vitest';
import { Zmanim } from '../src/index';
import { CITY_INFOS } from './cityInfos';

const { jerusalemSummer, newYorkInfo } = CITY_INFOS;

describe('isShabbat / isYomTov flags', () => {
  it('marks Saturday as Shabbat', () => {
    // 2026-07-18 is a Saturday
    const z = new Zmanim(jerusalemSummer, new Date(2026, 6, 18));
    assert.isTrue(z.getTimes().isShabbat);
    assert.isFalse(z.getTimes().isYomTov);
  });

  it('marks a weekday as neither Shabbat nor Yom Tov', () => {
    // 2026-07-15 is a Wednesday
    const z = new Zmanim(jerusalemSummer, new Date(2026, 6, 15));
    assert.isFalse(z.getTimes().isShabbat);
    assert.isFalse(z.getTimes().isYomTov);
  });

  it('drops isShabbat after Saturday tzeis (nightfall)', () => {
    // 2026-07-18 is a Saturday; 23:00 is well after tzeis in summer Jerusalem
    const afterNightfall = new Zmanim(jerusalemSummer, new Date(2026, 6, 18, 23, 0, 0));
    assert.isFalse(afterNightfall.getTimes().isShabbat);
    // ...but the daytime is still Shabbat
    const daytime = new Zmanim(jerusalemSummer, new Date(2026, 6, 18, 9, 0, 0));
    assert.isTrue(daytime.getTimes().isShabbat);
  });

  it('marks Erev Shabbat as Shabbat once past candle-lighting', () => {
    // 2026-07-17 is a Friday; candle-lighting is in the evening
    const beforeCandles = new Zmanim(jerusalemSummer, new Date(2026, 6, 17, 6, 0, 0));
    assert.isFalse(beforeCandles.getTimes().isShabbat);
    const afterCandles = new Zmanim(jerusalemSummer, new Date(2026, 6, 17, 23, 0, 0));
    assert.isTrue(afterCandles.getTimes().isShabbat);
  });

  it('marks Yom Kippur as Yom Tov in Israel', () => {
    // 2026-09-21 is 10 Tishrei 5787 (Yom Kippur)
    const z = new Zmanim(jerusalemSummer, new Date(2026, 8, 21));
    assert.isTrue(z.getTimes().isYomTov);
  });

  it('marks Erev Yom Tov as Yom Tov once past candle-lighting', () => {
    // 2026-09-11 (Fri) is Erev Rosh Hashana 5787
    const before = new Zmanim(jerusalemSummer, new Date(2026, 8, 11, 6, 0, 0));
    assert.isFalse(before.getTimes().isYomTov);
    const after = new Zmanim(jerusalemSummer, new Date(2026, 8, 11, 23, 0, 0));
    assert.isTrue(after.getTimes().isYomTov);
  });

  it('keeps isYomTov true after tzeis on the first day of a two-day Yom Tov', () => {
    // 2026-09-12 is day 1 of Rosh Hashana; 09-13 is day 2 — the festival runs into the night
    const day1AfterTzeis = new Zmanim(jerusalemSummer, new Date(2026, 8, 12, 23, 0, 0));
    assert.isTrue(day1AfterTzeis.getTimes().isYomTov);
  });

  it('drops isYomTov after tzeis on the final day of Yom Tov', () => {
    // 2026-09-13 is day 2 (last day) of Rosh Hashana; 09-14 is Tzom Gedaliah (a fast,
    // not a Yom Tov), so Rosh Hashana ends at tzeis on 09-13
    const lastDayAfterTzeis = new Zmanim(jerusalemSummer, new Date(2026, 8, 13, 23, 0, 0));
    assert.isFalse(lastDayAfterTzeis.getTimes().isYomTov);
    const lastDayDaytime = new Zmanim(jerusalemSummer, new Date(2026, 8, 13, 9, 0, 0));
    assert.isTrue(lastDayDaytime.getTimes().isYomTov);
  });

  it('uses chutz-laaretz rules for a diaspora city (second festival day)', () => {
    // 2026-10-03 is 22 Tishrei 5787 = Shmini Atzeret (a Yom Tov everywhere),
    // 2026-10-04 (23 Tishrei) is Simchat Torah — Yom Tov only in the diaspora.
    const simchatTorah = new Date(2026, 9, 4);
    const diaspora = new Zmanim(newYorkInfo, simchatTorah);
    const israel = new Zmanim(jerusalemSummer, simchatTorah);
    assert.isTrue(diaspora.getTimes().isYomTov);
    assert.isFalse(israel.getTimes().isYomTov);
  });
});
