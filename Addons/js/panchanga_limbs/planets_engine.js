import { getSwiss, normalizeDegrees } from "../../../js/birth_engine.js?v=100";

export const PLANET_RASIS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"
];

/**
 * Addon Module: Computes the precise sidereal longitudes and zodiac signs
 * for all major planets fixed to 7:00 AM IST.
 */
export async function calculateMajorPlanetsTransit(targetDate = new Date()) {
    const swe = await getSwiss();

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; // Locked to 7:00 AM IST

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);

    // Common calculation flag configuration for sidereal positions
    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL;

    // 1. Execute calculations for each major planet via Ephemeris constants
    const sunData = swe.calc_ut(julianDay, swe.SE_SUN, flags);
    const marsData = swe.calc_ut(julianDay, swe.SE_MARS, flags);
    const mercData = swe.calc_ut(julianDay, swe.SE_MERCURY, flags);
    const jupData = swe.calc_ut(julianDay, swe.SE_JUPITER, flags);
    const venData = swe.calc_ut(julianDay, swe.SE_VENUS, flags);
    const satData = swe.calc_ut(julianDay, swe.SE_SATURN, flags);

    // 2. Normalize longitudes smoothly between 0 and 360 degrees
    const positions = {
        sun: normalizeDegrees(sunData[0]),
        mars: normalizeDegrees(marsData[0]),
        mercury: normalizeDegrees(mercData[0]),
        jupiter: normalizeDegrees(jupData[0]),
        venus: normalizeDegrees(venData[0]),
        saturn: normalizeDegrees(satData[0])
    };

    // Helper map packager to assign Rasi details
    const packagePlanet = (long) => {
        const rasiIdx = Math.floor(long / 30);
        return {
            longitude: long,
            rasi: PLANET_RASIS[rasiIdx],
            rasiIndex: rasiIdx + 1 // 1-indexed for house calculations
        };
    };

    return {
        sun: packagePlanet(positions.sun),
        mars: packagePlanet(positions.mars),
        mercury: packagePlanet(positions.mercury),
        jupiter: packagePlanet(positions.jupiter),
        venus: packagePlanet(positions.venus),
        saturn: packagePlanet(positions.saturn)
    };
}