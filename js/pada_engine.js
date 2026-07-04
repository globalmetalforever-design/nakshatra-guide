import { calculateSunMoonLongitudes, normalizeDegrees } from "./birth_engine.js?v=12";

/**
 * Calculates Panchang data for a dynamic target date relative to the user's base location details.
 * @param {Object} birthInput - The original birth details profile (hour, minute, timezone, etc.)
 * @param {Date} targetDate - The specific calendar date to calculate the forecast for
 */
export async function getTodayPanchang(birthInput, targetDate = new Date()) {
    // 1. Structure the target date fields cleanly for the ephemeris reader
    const targetInput = {
        year: targetDate.getFullYear(),
        month: targetDate.getMonth() + 1,
        day: targetDate.getDate(),
        hour: birthInput.hour,
        minute: birthInput.minute,
        timezone: birthInput.timezone
    };

    // 2. Fetch the true planet positions for this specific target calendar day
    const positions = await calculateSunMoonLongitudes(targetInput);
    
    // 3. Compute transit Nakshatra indexes for this date
    const nakshatraTotalDegrees = 360 / 27;
    const nakshatraIndex = Math.floor(positions.siderealMoonLongitude / nakshatraTotalDegrees);
    
    // 4. Compute transit Tithi (Elongation tracking)
    const tithiIndex = Math.floor(positions.elongation / 12);

    return {
        julianDay: positions.julianDay,
        siderealMoonLongitude: positions.siderealMoonLongitude,
        siderealSunLongitude: positions.siderealSunLongitude,
        nakshatraIndex: nakshatraIndex,
        tithiIndex: tithiIndex,
        isWaxing: positions.isWaxing
    };
}