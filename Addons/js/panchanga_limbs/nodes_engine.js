import { getSwiss, normalizeDegrees } from "../../../js/birth_engine.js?v=100";

export const RASIS = [
    "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya",
    "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"
];

/**
 * Addon Module: Calculates the current positions of Rahu and Ketu
 * fixed precisely to 7:00 AM IST.
 */
export async function calculateNodesTransit(targetDate = new Date()) {
    const swe = await getSwiss();

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; // 7:00 AM IST

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);

    // Calculate Rahu (Mean Node) position
    const rahuData = swe.calc_ut(julianDay, swe.SE_MEAN_NODE, swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL);
    const rahuLong = normalizeDegrees(rahuData[0]);

    // Ketu is always exactly 180 degrees ahead/behind Rahu
    const ketuLong = normalizeDegrees(rahuLong + 180);

    const rahuRasiIndex = Math.floor(rahuLong / 30);
    const ketuRasiIndex = Math.floor(ketuLong / 30);

    return {
        rahu: { longitude: rahuLong, rasi: RASIS[rahuRasiIndex], rasiIndex: rahuRasiIndex + 1 },
        ketu: { longitude: ketuLong, rasi: RASIS[ketuRasiIndex], rasiIndex: ketuRasiIndex + 1 }
    };
}