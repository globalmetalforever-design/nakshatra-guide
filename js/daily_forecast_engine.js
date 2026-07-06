import { getSwiss, normalizeDegrees, toUtcDateParts } from "./birth_engine.js?v=100";

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

    const swe = await getSwiss();

    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHour = 12; 
    const currentTimezone = -(new Date().getTimezoneOffset() / 60);

    const utc = toUtcDateParts(targetYear, targetMonth, targetDay, targetHour, 0, currentTimezone);
    const julianDay = swe.julday(utc.year, utc.month, utc.day, utc.hour);

    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    
    const transitSunLong = normalizeDegrees(siderealSun[0]);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    // --- DYNAMIC TITHI CALCULATION ---
    const elongation = normalizeDegrees(transitMoonLong - transitSunLong);
    const tithiIndex = Math.floor(elongation / 12); 
    const tithiNumber = (tithiIndex % 15) + 1;      
    
    const tithiNames = [
        "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", 
        "Shashti", "Saptami", "Ashtami", "Navami", "Dashami", 
        "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima / Amavasya"
    ];
    
    let tithiName = tithiNames[tithiNumber - 1];
    if (tithiNumber === 15) {
        tithiName = tithiIndex === 14 ? "Purnima" : "Amavasya";
    }
    const fullTithiString = "";

    const nakshatraTotalDegrees = 360 / 27; 
    const transitNakshatraIndex = Math.floor(transitMoonLong / nakshatraTotalDegrees);

    const forecastText = computePersonalizedForecast(birthProfile.nakshatra.number, transitNakshatraIndex, fullTithiString);
    const attentionText = computePersonalizedAttention(birthProfile.rasi.number, transitMoonLong);
    const guidanceMetrics = computeLifestyleGuidance(birthProfile.nakshatra.number, transitNakshatraIndex);

    return {
        forecast: forecastText,
        attention: attentionText,
        guidance: guidanceMetrics
    };
}

function computePersonalizedForecast(birthNakshatraNum, transitBakshatraIndex, tithiString) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const tarabalaCategory = (distance % 9) || 9;

    const guidanceMap = {
        1: "A day of high focus and foundational adjustments. Channel your energy intentionally into personal development.",
        2: "Prosperous and favorable alignments dominate this date. Excellent window for initiating creative or material projects.",
        3: "Minor logistical obstacles or delays may surface today. Double-check small structural parameters before completing goals.",
        4: "Highly stable, comforting energy patterns. Ideal for routine work, grounding your home space, and steady execution.",
        5: "Internal friction or minor communication loops require patience today. Step back and think clearly before responding.",
        6: "Exceptional productivity and execution flow. Your innate skills align perfectly with clearing difficult objectives today.",
        7: "Intense energy patterns tracking transitions. Keep your commitments lightweight and focus on tracking restoration metrics.",
        8: "Harmonious interpersonal interactions dominate this frame. Collaboration, team communications, and agreements flow easily.",
        9: "Peak relationship and social support patterns. Guidance from key mentors or close connections is highly accessible today."
    };
    
    const coreForecast = guidanceMap[tarabalaCategory] || "Steady alignments tracking across this transit block.";
    
    // FIXED: Stripped out the leading template literals to pull the text up 2 lines
    return coreForecast;
}

function computePersonalizedAttention(birthRasiNum, transitMoonLong) {
    const transitRasiNum = Math.floor(transitMoonLong / 30) + 1;
    const rasiDistance = ((transitRasiNum - birthRasiNum + 12) % 12) + 1;

    if (rasiDistance === 1) return "Focus intensely on physical vitality, self-presentation, and prioritizing personal energy boundaries today.";
    if (rasiDistance === 4) return "Prioritize home environment stability, clear family check-ins, and deep psychological rejuvenation.";
    if (rasiDistance === 7) return "Attention shifts directly toward partnerships, close interpersonal relations, and mutual agreements.";
    if (rasiDistance === 8) return "Review hidden operational issues, auditing processes, research milestones, or legacy records with extra care.";
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