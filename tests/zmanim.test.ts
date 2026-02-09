import { describe, it, assert } from 'vitest';
import { Zmanim, CityInfo, CityRow, ChabadZmanim } from '../src/index';


// Jerusalem city info - winter (IST = UTC+2)
const jerusalemWinter: CityInfo = {
  latitude: 31.7683,
  longitude: 35.2137,
  country: 'Israel',
  city: 'Jerusalem',
  timezone: 2,
  dst: false,
  min: 40,
};

// Jerusalem city info - summer (IDT = UTC+3)
const jerusalemSummer: CityInfo = {
  latitude: 31.7683,
  longitude: 35.2137,
  country: 'Israel',
  city: 'Jerusalem',
  timezone: 3,
  dst: true,
  min: 40,
};

// Tel Aviv city info - summer
const telAvivSummer: CityInfo = {
  latitude: 32.0853,
  longitude: 34.7818,
  country: 'Israel',
  city: 'Tel Aviv',
  timezone: 3,
  dst: true,
  min: 23,
};

// New York city info
const newYorkInfo: CityInfo = {
  latitude: 40.7128,
  longitude: -74.006,
  country: 'United States',
  city: 'New York',
  timezone: -5,
  dst: false,
  min: 18,
};

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

describe('Zmanim - static methods', () => {
  it('isJerusalem - returns true for Jerusalem', () => {
    const row: CityRow = { latitude: 31.77, longitude: 35.21, country_en: 'Israel', city_en: 'Jerusalem' };
    assert.equal(Zmanim.isJerusalem(row), true);
  });

  it('isJerusalem - returns true for ירושלים', () => {
    const row: CityRow = { latitude: 31.77, longitude: 35.21, country_en: 'ישראל', city_en: 'ירושלים' };
    assert.equal(Zmanim.isJerusalem(row), true);
  });

  it('isJerusalem - returns false for Tel Aviv', () => {
    const row: CityRow = { latitude: 32.08, longitude: 34.78, country_en: 'Israel', city_en: 'Tel Aviv' };
    assert.equal(Zmanim.isJerusalem(row), false);
  });

  it('isHaifa - returns true for haifa', () => {
    const row: CityRow = { latitude: 32.79, longitude: 34.99, country_en: 'Israel', city_en: 'haifa' };
    assert.equal(Zmanim.isHaifa(row), true);
  });

  it('isIsrael - returns true for Israel', () => {
    const row: CityRow = { latitude: 32, longitude: 35, country_en: 'Israel' };
    assert.equal(Zmanim.isIsrael(row), true);
  });

  it('isIsrael - returns false for US', () => {
    const row: CityRow = { latitude: 40, longitude: -74, country_en: 'United States' };
    assert.equal(Zmanim.isIsrael(row), false);
  });

  it('getTimezoneName - returns tz_name if set', () => {
    const row: CityRow = { latitude: 0, longitude: 0, country_en: 'Israel', tz_name: 'Asia/Jerusalem' };
    assert.equal(Zmanim.getTimezoneName(row), 'Asia/Jerusalem');
  });

  it('getTimezoneName - returns Israel for Israeli cities', () => {
    const row: CityRow = { latitude: 0, longitude: 0, country_en: 'Israel' };
    assert.equal(Zmanim.getTimezoneName(row), 'Israel');
  });

  it('getTimezoneName - returns America/ prefix for US cities', () => {
    const row: CityRow = { latitude: 0, longitude: 0, country_en: 'New York', more: 'us' };
    assert.equal(Zmanim.getTimezoneName(row), 'America/New_York');
  });
});

describe('Zmanim - getCityInfoByRow', () => {
  it('sets min=40 for Jerusalem', () => {
    const row: CityRow = { latitude: 31.77, longitude: 35.21, country_en: 'Israel', city_en: 'Jerusalem' };
    const info = Zmanim.getCityInfoByRow(row, '2024-06-15');
    assert.equal(info.min, 40);
  });

  it('sets min=30 for Haifa', () => {
    const row: CityRow = { latitude: 32.79, longitude: 34.99, country_en: 'Israel', city_en: 'haifa' };
    const info = Zmanim.getCityInfoByRow(row, '2024-06-15');
    assert.equal(info.min, 30);
  });

  it('sets min=30 for other Israeli cities', () => {
    const row: CityRow = { latitude: 32.08, longitude: 34.78, country_en: 'Israel', city_en: 'Tel Aviv' };
    const info = Zmanim.getCityInfoByRow(row, '2024-06-15');
    assert.equal(info.min, 30);
  });

  it('sets min=18 for non-Israeli cities', () => {
    const row: CityRow = { latitude: 40.71, longitude: -74.0, country_en: 'New York', more: 'us' };
    const info = Zmanim.getCityInfoByRow(row, '2024-06-15');
    assert.equal(info.min, 18);
  });
});

describe('Zmanim - time calculations', () => {
  it('Jerusalem winter - sunrise around 6:00-7:30, sunset around 16:30-17:30', () => {
    const z = new Zmanim(jerusalemWinter, '2024-01-15');
    const sunrise = timeToMinutes(z.times.netzHachama);
    const sunset = timeToMinutes(z.times.shkiah);

    assert.ok(sunrise > 6 * 60, `sunrise ${z.times.netzHachama} should be after 6:00`);
    assert.ok(sunrise < 7 * 60 + 30, `sunrise ${z.times.netzHachama} should be before 7:30`);
    assert.ok(sunset > 16 * 60 + 30, `sunset ${z.times.shkiah} should be after 16:30`);
    assert.ok(sunset < 17 * 60 + 30, `sunset ${z.times.shkiah} should be before 17:30`);
  });

  it('Jerusalem summer - sunrise around 5:00-6:00, sunset around 19:00-20:30', () => {
    const z = new Zmanim(jerusalemSummer, '2024-06-21');
    const sunrise = timeToMinutes(z.times.netzHachama);
    const sunset = timeToMinutes(z.times.shkiah);

    assert.ok(sunrise > 5 * 60, `sunrise ${z.times.netzHachama} should be after 5:00`);
    assert.ok(sunrise < 6 * 60, `sunrise ${z.times.netzHachama} should be before 6:00`);
    assert.ok(sunset > 19 * 60, `sunset ${z.times.shkiah} should be after 19:00`);
    assert.ok(sunset < 20 * 60 + 30, `sunset ${z.times.shkiah} should be before 20:30`);
  });

  it('time order is correct: alot < tefillin < sunrise < shema < tefila < chatzos < minchaGedola < manchKtana < plagHamincha < shkiah < tzes', () => {
    const z = new Zmanim(jerusalemWinter, '2024-03-20');

    const order = [
      { name: 'alosHashachar', val: timeToMinutes(z.times.alosHashachar) },
      { name: 'tefillin', val: timeToMinutes(z.times.tefillin) },
      { name: 'netzHachama', val: timeToMinutes(z.times.netzHachama) },
      { name: 'kriasShema', val: timeToMinutes(z.times.kriasShema) },
      { name: 'tefila', val: timeToMinutes(z.times.tefila) },
      { name: 'chatzos', val: timeToMinutes(z.times.chatzos) },
      { name: 'minchaGedola', val: timeToMinutes(z.times.minchaGedola) },
      { name: 'manchKtana', val: timeToMinutes(z.times.manchKtana) },
      { name: 'plagHamincha', val: timeToMinutes(z.times.plagHamincha) },
      { name: 'shkiah', val: timeToMinutes(z.times.shkiah) },
      { name: 'tzesHakochavim', val: timeToMinutes(z.times.tzesHakochavim) },
    ];

    for (let i = 1; i < order.length; i++) {
      assert.ok(
        order[i].val > order[i - 1].val,
        `${order[i].name} (${order[i].val}) should be after ${order[i - 1].name} (${order[i - 1].val})`
      );
    }
  });

  it('shabbat enter is afternoon, shabbat exit is after enter', () => {
    const z = new Zmanim(jerusalemWinter, '2024-03-20');
    const shabbosEnter = timeToMinutes(z.times.shabbosEnter);
    const shabbosExit = timeToMinutes(z.times.shabbosExit);

    assert.ok(shabbosEnter > 15 * 60, 'shabbat enter should be after 15:00');
    assert.ok(shabbosEnter < 20 * 60, 'shabbat enter should be before 20:00');
    assert.ok(shabbosExit > shabbosEnter, 'shabbat exit should be after enter');
  });
});

describe('Zmanim - New York', () => {
  it('NY winter - reasonable sunrise/sunset', () => {
    const z = new Zmanim(newYorkInfo, '2024-01-15');
    const sunrise = timeToMinutes(z.times.netzHachama);
    const sunset = timeToMinutes(z.times.shkiah);

    assert.ok(sunrise > 6 * 60 + 30, `NY sunrise ${z.times.netzHachama} should be after 6:30`);
    assert.ok(sunrise < 8 * 60, `NY sunrise ${z.times.netzHachama} should be before 8:00`);
    assert.ok(sunset > 16 * 60, `NY sunset ${z.times.shkiah} should be after 16:00`);
    assert.ok(sunset < 17 * 60 + 30, `NY sunset ${z.times.shkiah} should be before 17:30`);
  });
});

describe('Zmanim - toTime', () => {
  it('formats time correctly with ceil', () => {
    const z = new Zmanim(jerusalemWinter, '2024-01-01');
    assert.equal(z.toTime(6.5), '6:30:00');
    assert.equal(z.toTime(12.0), '12:00:00');
    assert.equal(z.toTime(18.75), '18:45:00');
  });

  it('formats time correctly with floor', () => {
    const z = new Zmanim(jerusalemWinter, '2024-01-01');
    assert.equal(z.toTime(6.5, 'floor'), '6:30:00');
  });
});

describe('Zmanim - getTimes', () => {
  it('getTimes removes internal fields', () => {
    const z = new Zmanim(jerusalemWinter, '2024-03-20');
    const times = z.getTimes();

    assert.equal(times.sunrise, undefined);
    assert.equal(times.sunrise_num, undefined);
    assert.equal(times.sunset, undefined);
    assert.equal(times.sunset_num, undefined);
    assert.equal(times.shaa_zmanit, undefined);

    assert.notEqual(times.shabbosEnter, undefined);
    assert.notEqual(times.shabbosExit, undefined);
    assert.notEqual(times.DST, undefined);
    assert.notEqual(times.date, undefined);
  });
});

describe('Zmanim - Tel Aviv vs Jerusalem', () => {
  it('Tel Aviv sunrise is slightly later than Jerusalem (west)', () => {
    const zJlm = new Zmanim(jerusalemSummer, '2024-06-15');
    const zTlv = new Zmanim(telAvivSummer, '2024-06-15');

    const jlmSunrise = timeToMinutes(zJlm.times.netzHachama);
    const tlvSunrise = timeToMinutes(zTlv.times.netzHachama);

    assert.ok(tlvSunrise >= jlmSunrise, `TLV sunrise (${zTlv.times.netzHachama}) should be >= JLM sunrise (${zJlm.times.netzHachama})`);
  });
});

// ─── Accuracy tests vs MyZmanim.com ───

function timeToSeconds(t: string): number {
  const p = t.split(':').map(Number);
  return p[0] * 3600 + p[1] * 60 + (p[2] || 0);
}

function assertWithinSeconds(actual: string, expected: string, maxDiff: number, label: string) {
  const d = Math.abs(timeToSeconds(actual) - timeToSeconds(expected));
  assert.ok(d <= maxDiff, `${label}: ${actual} vs ${expected} (diff ${d}s, max ${maxDiff}s)`);
}

const jerusalemElev: CityInfo = {
  latitude: 31.7683, longitude: 35.2137,
  country: 'Israel', city: 'Jerusalem',
  timezone: 2, dst: false, min: 40, elevation: 650,
};

const safedElev: CityInfo = {
  latitude: 32.9646, longitude: 35.4960,
  country: 'Israel', city: 'Safed',
  timezone: 2, dst: false, min: 30, elevation: 570,
};

describe('Zmanim - accuracy vs MyZmanim (Jerusalem Feb 8 2026)', () => {
  const z = new Zmanim(jerusalemElev, '2026-02-08');
  const T = 30; // tolerance in seconds

  it('alos within 30s', () => assertWithinSeconds(z.times.alosHashachar, '5:13:45', T, 'alos'));
  it('tefillin within 30s', () => assertWithinSeconds(z.times.tefillin, '5:35:40', T, 'tefillin'));
  it('sunrise within 30s', () => assertWithinSeconds(z.times.netzHachama, '6:27:36', T, 'sunrise'));
  it('shema within 30s', () => assertWithinSeconds(z.times.kriasShema, '9:10:32', T, 'shema'));
  it('tefila within 30s', () => assertWithinSeconds(z.times.tefila, '10:04:51', T, 'tefila'));
  it('chatzot within 30s', () => assertWithinSeconds(z.times.chatzos, '11:53:28', T, 'chatzot'));
  it('mincha gedola within 30s', () => assertWithinSeconds(z.times.minchaGedola, '12:23:28', T, 'minchaG'));
  it('plag within 30s', () => assertWithinSeconds(z.times.plagHamincha, '16:11:27', T, 'plag'));
  it('sunset within 30s', () => assertWithinSeconds(z.times.shkiah, '17:19:21', T, 'sunset'));
  it('tzeis within 30s', () => assertWithinSeconds(z.times.tzesHakochavim, '17:56:54', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Safed Feb 13 2026)', () => {
  const z = new Zmanim(safedElev, '2026-02-13');
  const T = 30;

  it('alos within 30s', () => assertWithinSeconds(z.times.alosHashachar, '5:09:26', T, 'alos'));
  it('tefillin within 30s', () => assertWithinSeconds(z.times.tefillin, '5:31:32', T, 'tefillin'));
  it('sunrise within 30s', () => assertWithinSeconds(z.times.netzHachama, '6:23:44', T, 'sunrise'));
  it('shema within 30s', () => assertWithinSeconds(z.times.kriasShema, '9:08:04', T, 'shema'));
  it('chatzot within 30s', () => assertWithinSeconds(z.times.chatzos, '11:52:24', T, 'chatzot'));
  it('sunset within 30s', () => assertWithinSeconds(z.times.shkiah, '17:21:04', T, 'sunset'));
  it('tzeis within 30s', () => assertWithinSeconds(z.times.tzesHakochavim, '17:58:47', T, 'tzeis'));
  it('candle lighting within 30s', () => assertWithinSeconds(z.times.shabbosEnter, '16:55:20', T, 'candles'));
});

const brooklynInfo: CityInfo = {
  latitude: 40.6782, longitude: -73.9442,
  country: 'United States', city: 'Brooklyn',
  timezone: -5, dst: false, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Brooklyn Feb 8 2026)', () => {
  const z = new Zmanim(brooklynInfo, '2026-02-08');
  const T = 5; // Brooklyn is extremely precise — 5s tolerance

  it('alos within 5s', () => assertWithinSeconds(z.times.alosHashachar, '5:35:32', T, 'alos'));
  it('tefillin within 5s', () => assertWithinSeconds(z.times.tefillin, '6:06:59', T, 'tefillin'));
  it('sunrise within 5s', () => assertWithinSeconds(z.times.netzHachama, '6:58:07', T, 'sunrise'));
  it('shema (Gra/Tanya) within 5s', () => assertWithinSeconds(z.times.kriasShema, '9:34:10', T, 'shema'));
  it('tefila (Gra/Tanya) within 5s', () => assertWithinSeconds(z.times.tefila, '10:26:11', T, 'tefila'));
  it('chatzot within 5s', () => assertWithinSeconds(z.times.chatzos, '12:10:13', T, 'chatzot'));
  it('mincha gedola within 5s', () => assertWithinSeconds(z.times.minchaGedola, '12:40:13', T, 'minchaG'));
  it('plag (Gra/Tanya) within 5s', () => assertWithinSeconds(z.times.plagHamincha, '16:17:17', T, 'plag'));
  it('sunset within 5s', () => assertWithinSeconds(z.times.shkiah, '17:22:18', T, 'sunset'));
  it('tzeis within 5s', () => assertWithinSeconds(z.times.tzesHakochavim, '18:04:19', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Brooklyn Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(brooklynInfo, '2026-02-13');
  const T = 5;

  it('alos within 5s', () => assertWithinSeconds(z.times.alosHashachar, '5:30:08', T, 'alos'));
  it('tefillin within 5s', () => assertWithinSeconds(z.times.tefillin, '6:01:25', T, 'tefillin'));
  it('sunrise within 5s', () => assertWithinSeconds(z.times.netzHachama, '6:52:04', T, 'sunrise'));
  it('shema (Gra/Tanya) within 5s', () => assertWithinSeconds(z.times.kriasShema, '9:31:09', T, 'shema'));
  it('chatzot within 5s', () => assertWithinSeconds(z.times.chatzos, '12:10:14', T, 'chatzot'));
  it('plag (Gra/Tanya) within 5s', () => assertWithinSeconds(z.times.plagHamincha, '16:22:06', T, 'plag'));
  it('sunset within 5s', () => assertWithinSeconds(z.times.shkiah, '17:28:24', T, 'sunset'));
  it('tzeis within 5s', () => assertWithinSeconds(z.times.tzesHakochavim, '18:10:00', T, 'tzeis'));
  it('candle lighting within 5s', () => assertWithinSeconds(z.times.shabbosEnter, '17:10:24', T, 'candles'));
});

const parisInfo: CityInfo = {
  latitude: 48.8566, longitude: 2.3522,
  country: 'France', city: 'Paris',
  timezone: 1, dst: false, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Paris Feb 8 2026)', () => {
  const z = new Zmanim(parisInfo, '2026-02-08');
  const T = 10;

  it('alos within 10s', () => assertWithinSeconds(z.times.alosHashachar, '6:34:55', T, 'alos'));
  it('tefillin within 10s', () => assertWithinSeconds(z.times.tefillin, '7:11:07', T, 'tefillin'));
  it('sunrise within 10s', () => assertWithinSeconds(z.times.netzHachama, '8:10:35', T, 'sunrise'));
  it('shema (Gra/Tanya) within 10s', () => assertWithinSeconds(z.times.kriasShema, '10:37:51', T, 'shema'));
  it('chatzot within 10s', () => assertWithinSeconds(z.times.chatzos, '13:05:08', T, 'chatzot'));
  it('sunset within 10s', () => assertWithinSeconds(z.times.shkiah, '17:59:42', T, 'sunset'));
  it('tzeis within 10s', () => assertWithinSeconds(z.times.tzesHakochavim, '18:48:39', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Paris Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(parisInfo, '2026-02-13');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '6:27:39', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '7:03:40', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '8:02:25', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '10:33:48', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '13:05:11', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '18:07:58', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:56:18', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '17:49:58', T, 'candles'));
});

// Beit Shemesh (elevation 205m, tz 2, Israel, min 40)
const beitShemeshInfo: CityInfo = {
  latitude: 31.7514, longitude: 34.9886,
  country: 'Israel', city: 'Beit Shemesh',
  timezone: 2, dst: false, min: 40, elevation: 205,
};

describe('Zmanim - accuracy vs MyZmanim (Beit Shemesh Feb 8 2026)', () => {
  const z = new Zmanim(beitShemeshInfo, '2026-02-08');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:14:38', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:36:33', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:28:19', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:11:20', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:22', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:20:27', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:57:50', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Beit Shemesh Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(beitShemeshInfo, '2026-02-13');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:10:53', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:32:41', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:24:03', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:25', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:24:47', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:01:52', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '16:47:18', 15, 'candles'));
});

// Modiin (sea level, tz 2, Israel, min 30)
const modiinInfo: CityInfo = {
  latitude: 31.8978, longitude: 35.0104,
  country: 'Israel', city: 'Modiin',
  timezone: 2, dst: false, min: 30, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Modiin Feb 8 2026)', () => {
  const z = new Zmanim(modiinInfo, '2026-02-08');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:14:38', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:36:35', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:28:22', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:11:19', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:17', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:20:13', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:57:35', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Modiin Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(modiinInfo, '2026-02-13');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:10:52', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:24:04', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:19', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:24:36', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:01:40', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '16:54:36', T, 'candles'));
});

// Maaleh Adumim (sea level, tz 2, Israel, min 30, tefillin 11°)
const maalehAdumimInfo: CityInfo = {
  latitude: 31.7771, longitude: 35.3088,
  country: 'Israel', city: 'Maaleh Adumim',
  timezone: 2, dst: false, min: 30, elevation: 0, tefillinDeg: 11,
};

describe('Zmanim - accuracy vs MyZmanim (Maaleh Adumim Feb 8 2026)', () => {
  const z = new Zmanim(maalehAdumimInfo, '2026-02-08');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:13:25', T, 'alos'));
  it('tefillin (11°)', () => assertWithinSeconds(z.times.tefillin, '5:37:44', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:27:03', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:10:05', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:53:08', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:19:14', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:56:33', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Maaleh Adumim Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(maalehAdumimInfo, '2026-02-13');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:09:39', T, 'alos'));
  it('tefillin (11°)', () => assertWithinSeconds(z.times.tefillin, '5:33:51', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:22:47', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:53:11', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:23:35', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:00:36', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '16:53:35', T, 'candles'));
});

// Haifa (sea level, tz 2, Israel, min 30)
const haifaInfo: CityInfo = {
  latitude: 32.7940, longitude: 34.9896,
  country: 'Israel', city: 'Haifa',
  timezone: 2, dst: false, min: 30, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Haifa Feb 8 2026)', () => {
  const z = new Zmanim(haifaInfo, '2026-02-08');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:15:24', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:37:34', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:29:54', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:12:10', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:27', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:19:00', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:56:46', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Haifa Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(haifaInfo, '2026-02-13');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:11:28', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:25:26', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:29', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:23:32', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:01:00', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '16:53:32', T, 'candles'));
});

// London (sea level, tz 0, min 18)
const londonInfo: CityInfo = {
  latitude: 51.5074, longitude: -0.1278,
  country: 'United Kingdom', city: 'London',
  timezone: 0, dst: false, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (London Feb 8 2026)', () => {
  const z = new Zmanim(londonInfo, '2026-02-08');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:45:56', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '6:24:10', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '7:27:15', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:51:06', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '12:14:58', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:02:41', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:54:40', T, 'tzeis'));
});

// Melbourne (sea level, tz 11 AEDT, min 18, Southern Hemisphere)
const melbourneInfo: CityInfo = {
  latitude: -37.8136, longitude: 144.9631,
  country: 'Australia', city: 'Melbourne',
  timezone: 11, dst: true, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Melbourne Feb 9 2026)', () => {
  const z = new Zmanim(melbourneInfo, '2026-02-09');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:15:44', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:50:38', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:42:31', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '10:08:15', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '13:33:59', T, 'chatzot'));
  it('plag', () => assertWithinSeconds(z.times.plagHamincha, '18:59:43', T, 'plag'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '20:25:27', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '21:07:31', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Melbourne Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(melbourneInfo, '2026-02-13');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:21:34', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:47:00', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '13:33:59', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '20:20:59', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '21:02:32', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '20:02:59', T, 'candles'));
});

// Miami (sea level, tz -5, min 18)
const miamiInfo: CityInfo = {
  latitude: 25.7617, longitude: -80.1918,
  country: 'United States', city: 'Miami',
  timezone: -5, dst: false, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Miami Feb 8 2026)', () => {
  const z = new Zmanim(miamiInfo, '2026-02-08');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:51:05', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '6:17:43', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '7:00:36', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:47:50', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '12:35:05', T, 'chatzot'));
  it('plag', () => assertWithinSeconds(z.times.plagHamincha, '16:59:52', T, 'plag'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '18:09:34', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:44:43', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Miami Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(miamiInfo, '2026-02-13');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:48:13', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:57:16', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '12:35:06', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '18:12:56', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:47:49', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '17:54:56', T, 'candles'));
});

// Beer Sheva (sea level, tz 2, Israel, min 20)
const beerShevaInfo: CityInfo = {
  latitude: 31.2518, longitude: 34.7913,
  country: 'Israel', city: 'Beer Sheva',
  timezone: 2, dst: false, min: 20, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Beer Sheva Feb 8 2026)', () => {
  const z = new Zmanim(beerShevaInfo, '2026-02-08');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:15:06', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:36:54', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:28:19', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:11:44', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:55:09', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:22:01', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '17:59:07', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Beer Sheva Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(beerShevaInfo, '2026-02-13');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:11:25', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:24:08', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:55:12', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:26:16', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:03:05', T, 'tzeis'));
  it('candle lighting (20 min)', () => assertWithinSeconds(z.times.shabbosEnter, '17:06:16', T, 'candles'));
});

// Eilat (sea level, tz 2, Israel, min 30)
const eilatInfo: CityInfo = {
  latitude: 29.5577, longitude: 34.9519,
  country: 'Israel', city: 'Eilat',
  timezone: 2, dst: false, min: 30, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Eilat Feb 8 2026)', () => {
  const z = new Zmanim(eilatInfo, '2026-02-08');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:13:19', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '5:34:46', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:25:17', T, 'sunrise'));
  it('shema', () => assertWithinSeconds(z.times.kriasShema, '9:09:53', T, 'shema'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:30', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:23:44', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:00:11', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Eilat Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(eilatInfo, '2026-02-13');
  const T = 5;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '5:09:54', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:21:23', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '11:54:33', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:27:43', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:03:53', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '16:57:43', T, 'candles'));
});

// Sarcelles (sea level, tz 1, min 18)
const sarcellesInfo: CityInfo = {
  latitude: 48.9955, longitude: 2.3808,
  country: 'France', city: 'Sarcelles',
  timezone: 1, dst: false, min: 18, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Sarcelles Feb 8 2026)', () => {
  const z = new Zmanim(sarcellesInfo, '2026-02-08');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '6:34:47', T, 'alos'));
  it('tefillin', () => assertWithinSeconds(z.times.tefillin, '7:11:05', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '8:10:43', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '13:04:56', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:59:10', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:48:16', T, 'tzeis'));
});

describe('Zmanim - accuracy vs MyZmanim (Sarcelles Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(sarcellesInfo, '2026-02-13');
  const T = 10;

  it('alos', () => assertWithinSeconds(z.times.alosHashachar, '6:27:29', T, 'alos'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '8:02:30', T, 'sunrise'));
  it('chatzot', () => assertWithinSeconds(z.times.chatzos, '13:04:59', T, 'chatzot'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '18:07:29', T, 'sunset'));
  it('tzeis', () => assertWithinSeconds(z.times.tzesHakochavim, '18:55:57', T, 'tzeis'));
  it('candle lighting', () => assertWithinSeconds(z.times.shabbosEnter, '17:49:29', T, 'candles'));
});

// Kiryat Malachi (sea level, tz 2, Israel, min 30)
const kiryatMalachiInfo: CityInfo = {
  latitude: 31.7326, longitude: 34.7449,
  country: 'Israel', city: 'Kiryat Malachi',
  timezone: 2, dst: false, min: 30, elevation: 0,
};

describe('Zmanim - accuracy vs MyZmanim (Kiryat Malachi Feb 13 2026 Shabbat)', () => {
  const z = new Zmanim(kiryatMalachiInfo, '2026-02-13');
  const c = z.getChabadZmanim();
  const T = 5;

  it('alos 16.1°', () => assertWithinSeconds(z.times.alosHashachar, '5:11:50', T, 'alos'));
  it('alos 72 fixed', () => assertWithinSeconds(c.alos72, '5:12:55', T, 'alos72'));
  it('misheyakir 11.5°', () => assertWithinSeconds(c.misheyakir, '5:33:38', T, 'tefillin'));
  it('sunrise', () => assertWithinSeconds(z.times.netzHachama, '6:24:55', T, 'sunrise'));
  it('shema GRA', () => assertWithinSeconds(c.sofZmanShemaGra, '9:10:09', T, 'shemaGra'));
  it('shema AR 72', () => assertWithinSeconds(c.sofZmanShemaAR, '8:34:09', T, 'shemaAR'));
  it('tefila GRA', () => assertWithinSeconds(c.sofZmanTefilaGra, '10:05:13', T, 'tefilaGra'));
  it('tefila AR 72', () => assertWithinSeconds(c.sofZmanTefilaAR, '9:41:13', T, 'tefilaAR'));
  it('chatzot', () => assertWithinSeconds(c.chatzot, '11:55:23', T, 'chatzot'));
  it('mincha gedola GRA', () => assertWithinSeconds(c.minchaGedola, '12:22:55', 10, 'minchaG'));
  it('mincha ketana', () => assertWithinSeconds(c.minchaKetana, '15:08:09', T, 'minchaK'));
  it('plag', () => assertWithinSeconds(c.plagHamincha, '16:17:00', T, 'plag'));
  it('sunset', () => assertWithinSeconds(z.times.shkiah, '17:25:51', T, 'sunset'));
  it('candle lighting 30 min', () => assertWithinSeconds(z.times.shabbosEnter, '16:55:51', T, 'candles'));
  it('tzeis RT 72', () => assertWithinSeconds(c.tzeisRT, '18:37:51', T, 'tzeisRT'));
  it('chatzot layla', () => assertWithinSeconds(c.chatzotLayla, '23:54:56', T, 'chatzotL'));
});

describe('Zmanim - Chabad accuracy (Brooklyn Feb 13 2026)', () => {
  const z = new Zmanim(brooklynInfo, '2026-02-13');
  const c = z.getChabadZmanim();
  const T = 5;

  it('alos 72', () => assertWithinSeconds(c.alos72, '5:40:07', T, 'alos72'));
  it('shema GRA', () => assertWithinSeconds(c.sofZmanShemaGra, '9:31:10', T, 'shemaGra'));
  it('shema AR', () => assertWithinSeconds(c.sofZmanShemaAR, '8:55:10', T, 'shemaAR'));
  it('tefila GRA', () => assertWithinSeconds(c.sofZmanTefilaGra, '10:24:11', T, 'tefilaGra'));
  it('tefila AR', () => assertWithinSeconds(c.sofZmanTefilaAR, '10:00:11', T, 'tefilaAR'));
  it('chatzot', () => assertWithinSeconds(c.chatzot, '12:10:14', T, 'chatzot'));
  it('mincha gedola', () => assertWithinSeconds(c.minchaGedola, '12:36:44', T, 'minchaG'));
  it('mincha ketana', () => assertWithinSeconds(c.minchaKetana, '15:15:48', T, 'minchaK'));
  it('plag', () => assertWithinSeconds(c.plagHamincha, '16:22:04', T, 'plag'));
  it('tzeis RT 72', () => assertWithinSeconds(c.tzeisRT, '18:40:21', T, 'tzeisRT'));
  it('chatzot layla', () => assertWithinSeconds(c.chatzotLayla, '0:09:36', T, 'chatzotL'));
});

describe('Zmanim - Chabad accuracy (Jerusalem Feb 8 2026)', () => {
  const z = new Zmanim(jerusalemElev, '2026-02-08');
  const c = z.getChabadZmanim();
  const T = 30;

  it('alos 72', () => assertWithinSeconds(c.alos72, '5:15:36', T, 'alos72'));
  it('shema GRA', () => assertWithinSeconds(c.sofZmanShemaGra, '9:10:32', T, 'shemaGra'));
  it('shema AR', () => assertWithinSeconds(c.sofZmanShemaAR, '8:34:32', T, 'shemaAR'));
  it('tefila GRA', () => assertWithinSeconds(c.sofZmanTefilaGra, '10:04:51', T, 'tefilaGra'));
  it('tefila AR', () => assertWithinSeconds(c.sofZmanTefilaAR, '9:40:51', T, 'tefilaAR'));
  it('chatzot', () => assertWithinSeconds(c.chatzot, '11:53:28', T, 'chatzot'));
  it('mincha gedola', () => assertWithinSeconds(c.minchaGedola, '12:20:46', T, 'minchaG'));
  it('mincha ketana', () => assertWithinSeconds(c.minchaKetana, '15:04:25', 60, 'minchaK'));
  it('plag', () => assertWithinSeconds(c.plagHamincha, '16:11:27', T, 'plag'));
  it('tzeis RT 72', () => assertWithinSeconds(c.tzeisRT, '18:35:38', T, 'tzeisRT'));
  it('chatzot layla', () => assertWithinSeconds(c.chatzotLayla, '23:53:01', T, 'chatzotL'));
});

describe('Zmanim - Chabad accuracy (London Feb 13 2026)', () => {
  const z = new Zmanim(londonInfo, '2026-02-13');
  const c = z.getChabadZmanim();
  const T = 10;

  it('alos 72', () => assertWithinSeconds(c.alos72, '6:06:15', T, 'alos72'));
  it('misheyakir 10.2°', () => assertWithinSeconds(c.misheyakir, '6:16:00', T, 'tefillin'));
  it('shema GRA', () => assertWithinSeconds(c.sofZmanShemaGra, '9:46:39', T, 'shemaGra'));
  it('shema AR', () => assertWithinSeconds(c.sofZmanShemaAR, '9:10:39', T, 'shemaAR'));
  it('tefila GRA', () => assertWithinSeconds(c.sofZmanTefilaGra, '10:36:07', T, 'tefilaGra'));
  it('tefila AR', () => assertWithinSeconds(c.sofZmanTefilaAR, '10:12:07', T, 'tefilaAR'));
  it('chatzot', () => assertWithinSeconds(c.chatzot, '12:15:03', T, 'chatzot'));
  it('mincha gedola', () => assertWithinSeconds(c.minchaGedola, '12:39:47', T, 'minchaG'));
  it('plag', () => assertWithinSeconds(c.plagHamincha, '16:10:01', T, 'plag'));
  // London test uses min=18 (londonInfo), MyZmanim ref used min=15
  it('candle lighting 18 min', () => assertWithinSeconds(z.times.shabbosEnter, '16:53:55', T, 'candles'));
  it('tzeis RT 72', () => assertWithinSeconds(c.tzeisRT, '18:23:52', T, 'tzeisRT'));
  it('chatzot layla', () => assertWithinSeconds(c.chatzotLayla, '0:14:07', T, 'chatzotL'));
});

describe('Zmanim - Chabad accuracy (Melbourne Feb 13 2026)', () => {
  const z = new Zmanim(melbourneInfo, '2026-02-13');
  const c = z.getChabadZmanim();
  const T = 10;

  it('alos 72', () => assertWithinSeconds(c.alos72, '5:35:00', T, 'alos72'));
  it('shema GRA', () => assertWithinSeconds(c.sofZmanShemaGra, '10:10:29', T, 'shemaGra'));
  it('shema AR', () => assertWithinSeconds(c.sofZmanShemaAR, '9:34:29', T, 'shemaAR'));
  it('tefila GRA', () => assertWithinSeconds(c.sofZmanTefilaGra, '11:18:19', T, 'tefilaGra'));
  it('tefila AR', () => assertWithinSeconds(c.sofZmanTefilaAR, '10:54:19', T, 'tefilaAR'));
  it('chatzot', () => assertWithinSeconds(c.chatzot, '13:33:59', T, 'chatzot'));
  it('mincha gedola', () => assertWithinSeconds(c.minchaGedola, '14:07:54', T, 'minchaG'));
  it('plag', () => assertWithinSeconds(c.plagHamincha, '18:56:11', T, 'plag'));
  it('tzeis RT 72', () => assertWithinSeconds(c.tzeisRT, '21:32:59', T, 'tzeisRT'));
  it('chatzot layla', () => assertWithinSeconds(c.chatzotLayla, '1:34:33', T, 'chatzotL'));
});

