import { getSwiss, normalizeDegrees, toUtcDateParts } from "../../../js/birth_engine.js?v=100";

export const KARANA_NAMES = [
    "Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti",
    "Shakuni", "Chatushpada", "Naga", "Kintughna"
];

/**
 * Addon Module: Calculates the current daily Karana index and name
 * fixed precisely to 7:00 AM IST.
 */
export async function calculateKarana(targetDate = new Date()) {
    const swe = await getSwiss();

    // Lock parameters to 7:00 AM IST (1:30 AM UTC)
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; 

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);

    // Fetch Ephemeris longitudes to compute elongation
    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    
    const transitSunLong = normalizeDegrees(siderealSun[0]);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    const elongation = normalizeDegrees(transitMoonLong - transitSunLong);
    
    // Karana Index spans exactly 6 degrees (60 total Karanas in a 360 degree lunar month)
    const karanaIndex = Math.floor(elongation / 6); // 0 to 59

    let mappedKaranaName = "";

    // Astrological mapping rules for Fixed vs Mobile Karanas
    if (karanaIndex === 0) {
        mappedKaranaName = KARANA_NAMES[10]; // Kintughna (First half of 1st Tithi)
    } else if (karanaIndex >= 57) {
        // The final three half-tithis of the lunar month are fixed
        if (karanaIndex === 57) mappedKaranaName = KARANA_NAMES[7];  // Shakuni
        if (karanaIndex === 58) mappedKaranaName = KARANA_NAMES[8];  // Chatushpada
        if (karanaIndex === 59) mappedKaranaName = KARANA_NAMES[9];  // Naga
    } else {
        // The remaining 56 positions cycle through the 7 mobile Karanas repeating 8 times
        const mobileCycleIndex = (karanaIndex - 1) % 7;
        mappedKaranaName = KARANA_NAMES[mobileCycleIndex];
    }

    return {
        karana: mappedKaranaName
    };
}