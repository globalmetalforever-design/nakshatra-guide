import { generateTimeLockedForecast } from "../time_lock_addon.js";

/**
 * Addon Module: Generates a calculation payload for a specific manually requested history date.
 */
export async function calculateSpecificHistoryDate(birthProfile, rawDateString) {
    if (!rawDateString) return "Please enter a valid date.";
    
    try {
        const [yyyy, mm, dd] = rawDateString.split("-").map(Number);
        const targetDate = new Date(yyyy, mm - 1, d, 12, 0, 0);
        const dayMetrics = await generateTimeLockedForecast(birthProfile, targetDate);
        return dayMetrics.forecast;
    } catch (err) {
        console.error("Error computing explicit history date lookup:", err);
        return "Failed to compute forecast for the selected date. Please check the format.";
    }
}