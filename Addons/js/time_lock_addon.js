import { getSwiss, normalizeDegrees } from "../../js/birth_engine.js?v=100";
import { calculateVaraAndYoga } from "./panchanga_limbs/vara_yoga_addon.js";
import { calculateKarana } from "./panchanga_limbs/karana_addon.js";
import { calculateNodesTransit } from "./panchanga_limbs/nodes_engine.js";
import { calculateMajorPlanetsTransit } from "./panchanga_limbs/planets_engine.js";
import { PHRASE_BANK } from "./panchanga_limbs/phrase_bank_addon.js";

/**
 * Addon Module: Generates a high-accuracy, synthesized transit forecast 
 * fixed to 7:00 AM IST with combined forecast and attention streams in single-line format.
 */
export async function generateTimeLockedForecast(birthProfile, targetDate = new Date()) {
    if (!birthProfile || !birthProfile.nakshatra) {
        return {
            forecast: "Please enter your birth profile details.",
            guidance: { luckyColor: "-", luckyNumber: "-", goodTime: "-", badTime: "-", action: "-" }
        };
    }

    const swe = await getSwiss();

    const nodes = await calculateNodesTransit(targetDate);
    const planets = await calculateMajorPlanetsTransit(targetDate);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; 

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    const birthRasi = birthProfile.rasi.number;
    const houseMap = {
        sun: ((planets.sun.rasiIndex - birthRasi + 12) % 12) + 1,
        mars: ((planets.mars.rasiIndex - birthRasi + 12) % 12) + 1,
        jupiter: ((planets.jupiter.rasiIndex - birthRasi + 12) % 12) + 1,
        saturn: ((planets.saturn.rasiIndex - birthRasi + 12) % 12) + 1,
        rahu: ((nodes.rahu.rasiIndex - birthRasi + 12) % 12) + 1
    };

    const transitNakshatraIndex = Math.floor(transitMoonLong / (360 / 27));
    const daySeed = targetDay % 5;

    // Evaluate Categorized Traits
    let careerText = PHRASE_BANK.career.medium[daySeed % PHRASE_BANK.career.medium.length];
    if ([3, 6, 10, 11].includes(houseMap.sun) || [3, 6, 11].includes(houseMap.mars)) {
        careerText = PHRASE_BANK.career.high[targetDay % PHRASE_BANK.career.high.length]; 
    } else if ([4, 8, 12].includes(houseMap.saturn)) {
        careerText = PHRASE_BANK.career.low[daySeed % PHRASE_BANK.career.low.length]; 
    }

    let financeText = PHRASE_BANK.finance.medium[daySeed % PHRASE_BANK.finance.medium.length];
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) {
        financeText = PHRASE_BANK.finance.high[targetDay % PHRASE_BANK.finance.high.length]; 
    } else if ([6, 8, 12].includes(houseMap.rahu)) {
        financeText = PHRASE_BANK.finance.low[daySeed % PHRASE_BANK.finance.low.length]; 
    }

    const healthText = PHRASE_BANK.health[targetDay % PHRASE_BANK.health.length];
    const strengthText = PHRASE_BANK.strengths[targetDay % PHRASE_BANK.strengths.length];
    const remedyText = PHRASE_BANK.spirituality[targetDay % PHRASE_BANK.spirituality.length];
    const cautionText = PHRASE_BANK.caution[targetDay % PHRASE_BANK.caution.length];

    // Compute Attention Context
    const attentionText = addonComputeAttention(birthRasi, transitMoonLong);
    const guidanceMetrics = addonComputeGuidance(birthProfile.nakshatra.number, transitNakshatraIndex);

    // Formatted single line structures[cite: 13]
    const singleLineForecast = 
        `💼 CAREER: ${careerText}\n` +
        `💰 FINANCE: ${financeText}\n` +
        `🌱 VITALITY: ${healthText}\n` +
        `⚡ STRENGTH: ${strengthText}\n` +
        `⚠️ CAUTION: ${cautionText}\n` +
        `🧘 REMEDY: ${remedyText}\n\n` +
        `🎯 ATTENTION AREAS:\n${attentionText}`;

    return {
        forecast: singleLineForecast,
        guidance: guidanceMetrics
    };
}

function addonComputeAttention(birthRasiNum, transitMoonLong) {
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

function addonComputeGuidance(birthNakshatraNum, transitBakshatraIndex) {
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