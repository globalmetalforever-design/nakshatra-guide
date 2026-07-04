import { getTodayPanchang } from "./panchang_engine.js?v=13";

/**
 * Generates personalized daily forecasts, attention metrics, and lifestyle guidance
 * by comparing birth chart positions against dynamic daily transit data.
 */
export async function generateDailyForecast(birthProfile, targetDate = new Date()) {
    if (!birthProfile || !birthProfile.nakshatra) {
        return {
            forecast: "Please enter your birth profile details.",
            attention: "Birth details required.",
            guidance: { luckyColor: "-", luckyNumber: "-", goodTime: "-", badTime: "-", action: "-" }
        };
    }

    const dailyPanchang = await getTodayPanchang(birthProfile, targetDate);

    const forecastText = computePersonalizedForecast(birthProfile.nakshatra.number, dailyPanchang.nakshatraIndex);
    const attentionText = computePersonalizedAttention(birthProfile.rasi.number, dailyPanchang.siderealMoonLongitude);
    const guidanceMetrics = computeLifestyleGuidance(birthProfile.nakshatra.number, dailyPanchang.nakshatraIndex);

    return {
        forecast: forecastText,
        attention: attentionText,
        guidance: guidanceMetrics
    };
}

function computePersonalizedForecast(birthNakshatraNum, transitBakshatraIndex) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const tarabalaCategory = (distance % 9) || 9;

    // FIXED: Removed technical Sanskrit headers entirely to give only the pure forecast text
    const guidanceMap = {
        1: "A day of high focus and foundational adjustments. Channel your energy intentionally into personal development.",
        2: "Prosperous and favorable alignments dominate this date. Excellent window for initiating creative or material projects.",
        3: "Minor logistical obstacles or delays may surface today. Double-check small structural parameters before completing goals.",
        4: "Highly stable, comforting energy patterns. Ideal for routine work, grounding your home space, and steady execution.",
        5: "Internal friction or minor communication loops require patience today. Step back and think clearly before responding.",
        6: "Except productivity and execution flow. Your innate skills align perfectly with clearing difficult objectives today.",
        7: "Intense energy patterns tracking transitions. Keep your commitments lightweight and focus on tracking restoration metrics.",
        8: "Harmonious interpersonal interactions dominate this frame. Collaboration, team communications, and agreements flow easily.",
        9: "Peak relationship and social support patterns. Guidance from key mentors or close connections is highly accessible today."
    };
    return guidanceMap[tarabalaCategory] || "Steady alignments tracking across this transit block.";
}

function computePersonalizedAttention(birthRasiNum, transitMoonLong) {
    const transitRasiNum = Math.floor(transitMoonLong / 30) + 1;
    const rasiDistance = ((transitRasiNum - birthRasiNum + 12) % 12) + 1;

    if (rasiDistance === 1) return "Focus intensely on physical vitality, self-presentation, and prioritizing personal energy boundaries today.";
    if (rasiDistance === 4) return "Prioritize home environment stability, clear family check-ins, and deep psychological rejuvenation.";
    if (rasiDistance === 7) return "Attention shifts directly toward partnerships, close interpersonal relations, and mutual agreements.";
    if (rasiDistance === 8) return "Review hidden operational issues, auditing processes, research milestones, or legacy records.";
    if (rasiDistance === 10) return "High professional visibility today. Direct focus toward launching strategic vocational milestones.";
    if (rasiDistance === 12) return "High mental expenditures. Prioritize back-office cleaning, clearing digital storage spaces, and deep sleep cycles.";

    return "Maintain your baseline routine tracking. Review open logistical files and handle standard milestones.";
}

function computeLifestyleGuidance(birthNakshatraNum, transitBakshatraIndex) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const score = (distance % 9) || 9;

    const isFavorable = [2, 4, 6, 8, 9].includes(score);

    return {
        luckyColor: isFavorable ? "Yellow / Cream" : "Charcoal / Silver",
        luckyNumber: isFavorable ? String((score * 3) % 9 || 9) : String((score * 2) % 7 || 3),
        goodTime: isFavorable ? "09:30 AM - 11:00 AM" : "02:15 PM - 03:45 PM",
        badTime: isFavorable ? "04:30 PM - 05:45 PM" : "07:30 AM - 09:00 AM",
        action: isFavorable 
            ? "Great day to start new tasks, submit vital work, and hold key meetings." 
            : "Focus on organizing existing paperwork, background testing, and administrative cleanup."
    };
}