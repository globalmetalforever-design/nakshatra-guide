import { calculateSunMoonLongitudes, normalizeDegrees } from "./swiss_wrapper.js";
import { calculatePlanetaryPositions } from "./planet_engine.js";
import SwissEph from "./swisseph/swisseph.js";
const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", 
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", 
    "Hasta", "Chitra", "Svati", "Vishakha", "Anuradha", "Jyeshtha", 
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", 
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const RASI_NAMES = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrishchika", "Dhanu", "Makara", "Kumbha", "Meena"
];

const WESTERN_ZODIAC = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export async function getBirthData(input) {
    // 1. Invoke raw calculations from the ephemeris wrapper
    const astro = await calculateSunMoonLongitudes(input);

    const ayanamsa = astro.ayanamsa;
    const tropicalSun = astro.tropicalSunLongitude;
    const siderealMoon = astro.siderealMoonLongitude;

    const sunSidereal = normalizeDegrees(tropicalSun - ayanamsa);

    // 2. Map Sidereal Moon to Nakshatra and Pada
    const totalNakshatras = 27;
    const degreesPerNakshatra = 360 / totalNakshatras; // 13.3333°
    const degreesPerPada = degreesPerNakshatra / 4;    // 3.3333°

    const nakshatraIndex = Math.min(Math.floor(siderealMoon / degreesPerNakshatra), 26);
    const remainderDegrees = siderealMoon % degreesPerNakshatra;
    const padaNumber = Math.min(Math.floor(remainderDegrees / degreesPerPada) + 1, 4);

    const nakshatra = {
        number: nakshatraIndex + 1,
        name: NAKSHATRAS[nakshatraIndex]
    };

    const pada = {
        number: padaNumber
    };

    // 3. Determine Lunar Tithi Profile (Waxing vs Waning)
    const elongation = normalizeDegrees(siderealMoon - sunSidereal);
    const isWaxing = elongation < 180;

    // 4. Calculate Lunar Speed Dynamics
    let moonSpeedStatus = "Average";
    if (astro.moonSpeed !== undefined) {
        if (astro.moonSpeed > 14.5) {
            moonSpeedStatus = "Accelerated";
        } else if (astro.moonSpeed < 12.0) {
            moonSpeedStatus = "Retarded";
        }
    }

    // 5. Establish Vedic Rasi and Western Zodiac Coordinates
    const rasiIndex = Math.min(Math.floor(siderealMoon / 30), 11);
    const westernIndex = Math.min(Math.floor(tropicalSun / 30), 11);

    const rasi = {
        name: RASI_NAMES[rasiIndex]
    };

    const zodiac = {
        name: WESTERN_ZODIAC[westernIndex]
    };

    // 6. Compute the Full 9-Planet Sidereal Matrix using 'input' context
    const natalPlanets = await calculatePlanetaryPositions({
        year: input.year,
        month: input.month,
        day: input.day,
        hour: input.hour,
        minute: input.minute,
        timezone: input.timezone
    });

    // 7. Compile unified astronomical response payload
    return {
        nakshatra,
        pada,
        rasi,
        zodiac,
        isWaxing,
        moonSpeedStatus,
        planets: natalPlanets
    };
}