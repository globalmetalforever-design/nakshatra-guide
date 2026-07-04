import Swisseph from "https://cdn.jsdelivr.net/gh/prolaxu/swisseph-wasm@main/src/swisseph.js";

let swissPromise = null;
const SECONDS_PER_HOUR = 3600000;

export const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
    "Hasta", "Chitra", "Swati", "Visakha", "Anuradha", "Jyeshtha", 
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", 
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export const RASIS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"
];

export const WESTERN_ZODIAC = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export function assertFiniteNumber(value, name) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        throw new TypeError(`${name} must be a finite number.`);
    }
    return numberValue;
}

export function normalizeDegrees(degrees) {
    return ((degrees % 360) + 360) % 360;
}

export function toUtcDateParts(year, month, day, hour, minute, timezone) {
    const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - (timezone * SECONDS_PER_HOUR);
    const utcDate = new Date(utcMillis);
    return {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
        hour: utcDate.getUTCHours() + (utcDate.getUTCMinutes() / 60) + (utcDate.getUTCSeconds() / 3600)
    };
}

export async function getSwiss() {
    if (!swissPromise) {
        swissPromise = (async () => {
            const swe = new Swisseph();
            await swe.initSwissEph();
            swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
            return swe;
        })();
    }
    return swissPromise;
}

export async function calculateSunMoonLongitudes(birthInput) {
    const parts = normalizeBirthInput(birthInput);
    const swe = await getSwiss();

    const utc = toUtcDateParts(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.timezone);
    const julianDay = swe.julday(utc.year, utc.month, utc.day, utc.hour);

    // 1. Run raw ephemeris data calculations
    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const tropicalSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED);
    const tropicalMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED);
    const ayanamsa = swe.get_ayanamsa_ut(julianDay);

    // 2. Map strictly ordered clean sequential variables
    const sunSiderealLong = normalizeDegrees(siderealSun[0]);
    const moonSiderealLong = normalizeDegrees(siderealMoon[0]);
    const elongation = normalizeDegrees(moonSiderealLong - sunSiderealLong);

    return {
        julianDay,
        utc,
        ayanamsa,
        tropicalSunLongitude: normalizeDegrees(tropicalSun[0]),
        tropicalMoonLongitude: normalizeDegrees(tropicalMoon[0]),
        siderealMoonLongitude: moonSiderealLong,
        siderealSunLongitude: sunSiderealLong,
        isWaxing: elongation < 180,
        elongation: elongation
    };
}

export async function calculateMoonLongitudes(birthInput) {
    return calculateSunMoonLongitudes(birthInput);
}

export async function getBirthData(birthInput) {
    const longitudes = await calculateSunMoonLongitudes(birthInput);
    
    const nakshatraTotalDegrees = 360 / 27; 
    const nakshatraIndex = Math.floor(longitudes.siderealMoonLongitude / nakshatraTotalDegrees);
    const nakshatraName = NAKSHATRAS[nakshatraIndex];

    const remainingDegrees = longitudes.siderealMoonLongitude % nakshatraTotalDegrees;
    const padaNumber = Math.floor(remainingDegrees / (nakshatraTotalDegrees / 4)) + 1;

    const rasiIndex = Math.floor(longitudes.siderealMoonLongitude / 30);
    const rasiName = RASIS[rasiIndex];

    const westernIndex = Math.floor(longitudes.tropicalSunLongitude / 30);
    const westernName = WESTERN_ZODIAC[westernIndex];

    return {
        nakshatra: { number: nakshatraIndex + 1, name: nakshatraName },
        pada: { number: padaNumber },
        rasi: { number: rasiIndex + 1, name: rasiName },
        zodiac: { name: westernName }
    };
}

export function normalizeBirthInput(birthInput) {
    if (!birthInput || typeof birthInput !== "object") {
        throw new TypeError("Birth input must be an object.");
    }
    return {
        year: assertFiniteNumber(birthInput.year, "year"),
        month: assertFiniteNumber(birthInput.month, "month"),
        day: assertFiniteNumber(birthInput.day, "day"),
        hour: assertFiniteNumber(birthInput.hour, "hour"),
        minute: assertFiniteNumber(birthInput.minute ?? 0, "minute"),
        timezone: assertFiniteNumber(birthInput.timezone ?? 0, "timezone")
    };
}

export function closeSwiss() {
    if (!swissPromise) return Promise.resolve();
    return swissPromise.then((swe) => {
        swe.close();
        swissPromise = null;
    });
}