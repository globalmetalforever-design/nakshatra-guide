import { getSwiss, normalizeDegrees, toUtcDateParts } from "../../../js/birth_engine.js?v=100";

export const VARA_NAMES = [
    "Ravivara (Sunday)", "Somavara (Monday)", "Mangalavara (Tuesday)", 
    "Budhavara (Wednesday)", "Guruvara (Thursday)", "Sukravara (Friday)", "Sanivara (Saturday)"
];

export const YOGA_NAMES = [
    "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", 
    "Dhriti", "Shula", "Ganda", "Vridhi", "Dhruva", "Vyaghata", "Harshana", 
    "Vajra", "Siddhi", "Vyatipata", "Variyan", "Parigha", "Shiva", "Siddha", 
    "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

/**
 * Addon Module: Calculates the current daily Vara and Yoga configurations
 * fixed precisely to 7:00 AM IST.
 */
export async function calculateVaraAndYoga(targetDate = new Date()) {
    const swe = await getSwiss();

    // Lock parameters to 7:00 AM IST (1:30 AM UTC)
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; 

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);

    // 1. Calculate Vara (0 = Sunday, 1 = Monday, etc.)
    // Note: Standard calendar day indexing aligns seamlessly for a fixed 7 AM calculation
    const weekdayIndex = targetDate.getDay();
    const varaName = VARA_NAMES[weekdayIndex];

    // 2. Fetch Ephemeris longitudes to compute Yoga
    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    
    const transitSunLong = normalizeDegrees(siderealSun[0]);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    // Yoga Formula: (Sun Longitude + Moon Longitude) normalized to 360, divided by 13°20'
    const yogaLongitude = normalizeDegrees(transitSunLong + transitMoonLong);
    const yogaLengthDegrees = 360 / 27; // 13.3333 degrees
    const yogaIndex = Math.floor(yogaLongitude / yogaLengthDegrees) % 27;
    const yogaName = YOGA_NAMES[yogaIndex];

    return {
        vara: varaName,
        yoga: yogaName
    };
}