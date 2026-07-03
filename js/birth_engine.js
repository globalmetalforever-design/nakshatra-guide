// REMOVED: import SwissEph from "./swisseph/swisseph.js";

let swissPromise = null;

const SECONDS_PER_HOUR = 3600000;

function assertFiniteNumber(value, name) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
        throw new TypeError(`${name} must be a finite number.`);
    }

    return numberValue;
}

function normalizeDegrees(degrees) {
    return ((degrees % 360) + 360) % 360;
}

function toUtcDateParts(year, month, day, hour, minute, timezone) {
    const utcMillis =
        Date.UTC(year, month - 1, day, hour, minute, 0, 0) -
        (timezone * SECONDS_PER_HOUR);

    const utcDate = new Date(utcMillis);

    return {
        year: utcDate.getUTCFullYear(),
        month: utcDate.getUTCMonth() + 1,
        day: utcDate.getUTCDate(),
        hour:
            utcDate.getUTCHours() +
            (utcDate.getUTCMinutes() / 60) +
            (utcDate.getUTCSeconds() / 3600)
    };
}

async function getSwiss() {
    if (!swissPromise) {
        swissPromise = (async () => {
            // Safe fallback lookup against window or global context spaces
            const GlobalSwissEph = window.SwissEph || SwissEph;
            
            if (!GlobalSwissEph) {
                throw new Error("SwissEph library was not loaded into the global scope. Verify index.html tags.");
            }

            const swe = new GlobalSwissEph();
            await swe.initSwissEph();
            swe.set_sid_mode(swe.SE_SIDM_LAHIRI, 0, 0);
            return swe;
        })();
    }

    return swissPromise;
}

async function getJulianDayFromBirthTime(birthInput) {
    const parts = normalizeBirthInput(birthInput);
    const swe = await getSwiss();
    const utc = toUtcDateParts(
        parts.year,
        parts.month,
        parts.day,
        parts.hour,
        parts.minute,
        parts.timezone
    );

    return swe.julday(utc.year, utc.month, utc.day, utc.hour);
}

function normalizeBirthInput(birthInput) {
    if (!birthInput || typeof birthInput !== "object") {
        throw new TypeError("Birth input must be an object.");
    }

    const year = assertFiniteNumber(birthInput.year, "year");
    const month = assertFiniteNumber(birthInput.month, "month");
    const day = assertFiniteNumber(birthInput.day, "day");
    const hour = assertFiniteNumber(birthInput.hour, "hour");
    const minute = assertFiniteNumber(birthInput.minute ?? 0, "minute");
    const timezone = assertFiniteNumber(birthInput.timezone ?? 0, "timezone");

    if (month < 1 || month > 12) {
        throw new RangeError("month must be between 1 and 12.");
    }

    if (day < 1 || day > 31) {
        throw new RangeError("day must be between 1 and 31.");
    }

    if (hour < 0 || hour > 23) {
        throw new RangeError("hour must be between 0 and 23.");
    }

    if (minute < 0 || minute > 59) {
        throw new RangeError("minute must be between 0 and 59.");
    }

    return {
        year,
        month,
        day,
        hour,
        minute,
        timezone,
        latitude:
            birthInput.latitude === undefined || birthInput.latitude === ""
                ? null
                : assertFiniteNumber(birthInput.latitude, "latitude"),
        longitude:
            birthInput.longitude === undefined || birthInput.longitude === ""
                ? null
                : assertFiniteNumber(birthInput.longitude, "longitude")
    };
}

async function calculateSunMoonLongitudes(birthInput) {
    const parts = normalizeBirthInput(birthInput);
    const swe = await getSwiss();

    const utc = toUtcDateParts(
        parts.year,
        parts.month,
        parts.day,
        parts.hour,
        parts.minute,
        parts.timezone
    );

    const julianDay = swe.julday(
        utc.year,
        utc.month,
        utc.day,
        utc.hour
    );

    const siderealSun = swe.calc_ut(
        julianDay,
        swe.SE_SUN,
        swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL
    );

    const siderealMoon = swe.calc_ut(
        julianDay,
        swe.SE_MOON,
        swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL
    );

    const tropicalSun = swe.calc_ut(
        julianDay,
        swe.SE_SUN,
        swe.SEFLG_SWIEPH | swe.SEFLG_SPEED
    );

    const tropicalMoon = swe.calc_ut(
        julianDay,
        swe.SE_MOON,
        swe.SEFLG_SWIEPH | swe.SEFLG_SPEED
    );

    const ayanamsa = swe.get_ayanamsa_ut(julianDay);

    const sunSiderealLong = normalizeDegrees(siderealSun[0]);
    const moonSiderealLong = normalizeDegrees(siderealMoon[0]);
    
    const elongation = normalizeDegrees(moonSiderealLong - sunSiderealLong);
    const isWaxing = elongation < 180;

    return {
        julianDay,
        utc,
        ayanamsa,

        tropicalSunLongitude: normalizeDegrees(tropicalSun[0]),
        tropicalMoonLongitude: normalizeDegrees(tropicalMoon[0]),
        siderealMoonLongitude: moonSiderealLong,
        siderealSunLongitude: sunSiderealLong,

        tropicalSunSpeed: tropicalSun[3],
        tropicalMoonSpeed: tropicalMoon[3],
        
        siderealSunSpeed: siderealSun[3],
        siderealMoonSpeed: siderealMoon[3],
        isWaxing: isWaxing,
        elongation: elongation
    };
}

async function calculateMoonLongitudes(birthInput) {
    return calculateSunMoonLongitudes(birthInput);
}

function closeSwiss() {
    if (!swissPromise) {
        return Promise.resolve();
    }

    return swissPromise.then((swe) => {
        swe.close();
        swissPromise = null;
    });
}

export {
    calculateMoonLongitudes,
    calculateSunMoonLongitudes,
    closeSwiss,
    getJulianDayFromBirthTime,
    getSwiss,
    normalizeBirthInput,
    normalizeDegrees
};

if (typeof window !== "undefined") {
    window.NakshatraSwissWrapper = {
        calculateMoonLongitudes,
        calculateSunMoonLongitudes,
        closeSwiss,
        getJulianDayFromBirthTime,
        getSwiss,
        normalizeBirthInput,
        normalizeDegrees
    };
}