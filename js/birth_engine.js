// Replace line 1 with this explicit browser module endpoint:
import Swisseph from "https://unpkg.com/swisseph@2.10.3-0/dist/swisseph.api.js";

let swissPromise = null;
const SECONDS_PER_HOUR = 3600000;

export const NAKSHATRAS = [ //[cite: 2]
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
    "Hasta", "Chitra", "Swati", "Visakha", "Anuradha", "Jyeshtha", 
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", 
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
]; //[cite: 2]

export const RASIS = [ //[cite: 2]
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"
]; //[cite: 2]

export const WESTERN_ZODIAC = [ //[cite: 2]
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]; //[cite: 2]

export function assertFiniteNumber(value, name) { //[cite: 2]
    const numberValue = Number(value); //[cite: 2]
    if (!Number.isFinite(numberValue)) { //[cite: 2]
        throw new TypeError(`${name} must be a finite number.`); //[cite: 2]
    } //[cite: 2]
    return numberValue; //[cite: 2]
} //[cite: 2]

// FIXED: Explicitly exported so panchang_engine.js and other modules can use it
export function normalizeDegrees(degrees) {
    return ((degrees % 360) + 360) % 360; //[cite: 2]
}

export function toUtcDateParts(year, month, day, hour, minute, timezone) { //[cite: 2]
    const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0) - (timezone * SECONDS_PER_HOUR); //[cite: 2]
    const utcDate = new Date(utcMillis); //[cite: 2]
    return { //[cite: 2]
        year: utcDate.getUTCFullYear(), //[cite: 2]
        month: utcDate.getUTCMonth() + 1, //[cite: 2]
        day: utcDate.getUTCDate(), //[cite: 2]
        hour: utcDate.getUTCHours() + (utcDate.getUTCMinutes() / 60) + (utcDate.getUTCSeconds() / 3600) //[cite: 2]
    }; //[cite: 2]
} //[cite: 2]

async function getSwiss() {
    if (!swissPromise) {
        // FIXED: Assign the execution chain directly to swissPromise
        swissPromise = (async () => {
            const swe = new Swisseph();
            await swe.initSwissEph();
            swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
            return swe;
        })();
    }
    return swissPromise;
}

export async function calculateSunMoonLongitudes(birthInput) { //[cite: 2]
    const parts = normalizeBirthInput(birthInput); //[cite: 2]
    const swe = await getSwiss(); //[cite: 2]

    const utc = toUtcDateParts(parts.year, parts.month, parts.day, parts.hour, parts.minute, parts.timezone); //[cite: 2]
    const julianDay = swe.julday(utc.year, utc.month, utc.day, utc.hour); //[cite: 2]

    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL); //[cite: 2]
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL); //[cite: 2]
    const tropicalSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED); //[cite: 2]
    const tropicalMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED); //[cite: 2]
    const ayanamsa = swe.get_ayanamsa_ut(julianDay); //[cite: 2]

    const sunSiderealLong = normalizeDegrees(sunSiderealLong ?? siderealSun[0]);
    const moonSiderealLong = normalizeDegrees(moonSiderealLong ?? siderealMoon[0]);
    const elongation = normalizeDegrees(moonSiderealLong - sunSiderealLong);

    return { //[cite: 2]
        julianDay, //[cite: 2]
        utc, //[cite: 2]
        ayanamsa, //[cite: 2]
        tropicalSunLongitude: normalizeDegrees(tropicalSun[0]), //[cite: 2]
        tropicalMoonLongitude: normalizeDegrees(tropicalMoon[0]), //[cite: 2]
        siderealMoonLongitude: moonSiderealLong, //[cite: 2]
        siderealSunLongitude: sunSiderealLong, //[cite: 2]
        isWaxing: elongation < 180, //[cite: 2]
        elongation: elongation //[cite: 2]
    }; //[cite: 2]
} //[cite: 2]

export async function calculateMoonLongitudes(birthInput) { //[cite: 2]
    return calculateSunMoonLongitudes(birthInput); //[cite: 2]
} //[cite: 2]

export async function getBirthData(birthInput) { //[cite: 2]
    const longitudes = await calculateSunMoonLongitudes(birthInput); //[cite: 2]
    
    const nakshatraTotalDegrees = 360 / 27; //[cite: 2]
    const nakshatraIndex = Math.floor(longitudes.siderealMoonLongitude / nakshatraTotalDegrees); //[cite: 2]
    const nakshatraName = NAKSHATRAS[nakshatraIndex]; //[cite: 2]

    const remainingDegrees = longitudes.siderealMoonLongitude % nakshatraTotalDegrees; //[cite: 2]
    const padaNumber = Math.floor(remainingDegrees / (nakshatraTotalDegrees / 4)) + 1; //[cite: 2]

    const rasiIndex = Math.floor(longitudes.siderealMoonLongitude / 30); //[cite: 2]
    const rasiName = RASIS[rasiIndex]; //[cite: 2]

    const westernIndex = Math.floor(longitudes.tropicalSunLongitude / 30); //[cite: 2]
    const westernName = WESTERN_ZODIAC[westernIndex]; //[cite: 2]

    return { //[cite: 2]
        nakshatra: { number: nakshatraIndex + 1, name: nakshatraName }, //[cite: 2]
        pada: { number: padaNumber }, //[cite: 2]
        rasi: { number: rasiIndex + 1, name: rasiName }, //[cite: 2]
        zodiac: { name: westernName } //[cite: 2]
    }; //[cite: 2]
} //[cite: 2]

export function normalizeBirthInput(birthInput) { //[cite: 2]
    if (!birthInput || typeof birthInput !== "object") { //[cite: 2]
        throw new TypeError("Birth input must be an object."); //[cite: 2]
    } //[cite: 2]
    return { //[cite: 2]
        year: assertFiniteNumber(birthInput.year, "year"), //[cite: 2]
        month: assertFiniteNumber(birthInput.month, "month"), //[cite: 2]
        day: assertFiniteNumber(birthInput.day, "day"), //[cite: 2]
        hour: assertFiniteNumber(birthInput.hour, "hour"), //[cite: 2]
        minute: assertFiniteNumber(birthInput.minute ?? 0, "minute"), //[cite: 2]
        timezone: assertFiniteNumber(birthInput.timezone ?? 0, "timezone") //[cite: 2]
    }; //[cite: 2]
} //[cite: 2]

export function closeSwiss() { //[cite: 2]
    if (!swissPromise) return Promise.resolve(); //[cite: 2]
    return swissPromise.then((swe) => { //[cite: 2]
        swe.close(); //[cite: 2]
        swissPromise = null; //[cite: 2]
    }); //[cite: 2]
} //[cite: 2]