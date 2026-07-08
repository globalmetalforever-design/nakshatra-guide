import { getSwiss, normalizeDegrees } from "../../js/birth_engine.js?v=103";
import { calculateVaraAndYoga } from "./panchanga_limbs/vara_yoga_addon.js";
import { calculateKarana } from "./panchanga_limbs/karana_addon.js";
import { calculateNodesTransit } from "./panchanga_limbs/nodes_engine.js";
import { calculateMajorPlanetsTransit } from "./panchanga_limbs/planets_engine.js";
import { PHRASE_BANK } from "./panchanga_limbs/phrase_bank_addon.js";
import { checkPlanetaryVedha } from "./panchanga_limbs/vedha_addon.js";

/**
 * Addon Module: Generates high-accuracy transit forecasts fixed to 7:00 AM IST
 * with integrated Gochara Vedha exception rules.
 */
export async function generateTimeLockedForecast(birthProfile, targetDate = new Date()) {
    if (!birthProfile || !birthProfile.nakshatra) {
        return {
            forecast: "Please enter your birth profile details.",
            guidance: { luckyColor: "-", luckyNumber: "-", goodTime: "-", badTime: "-", action: "-" }
        };
    }

    const swe = await getSwiss();

    // 1. Fetch dynamic 7:00 AM IST planetary coordinates
    const nodes = await calculateNodesTransit(targetDate);
    const planets = await calculateMajorPlanetsTransit(targetDate);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; // Calibrated exactly to 7:00 AM IST

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    // 2. Map Houses Relative to Birth Moon Sign (Janma Rasi acts as House 1)
    const birthRasi = birthProfile.rasi.number;
    const houseMap = {
        sun: ((planets.sun.rasiIndex - birthRasi + 12) % 12) + 1,
        moon: ((Math.floor(transitMoonLong / 30) + 1 - birthRasi + 12) % 12) + 1,
        mars: ((planets.mars.rasiIndex - birthRasi + 12) % 12) + 1,
        mercury: ((planets.mercury.rasiIndex - birthRasi + 12) % 12) + 1,
        jupiter: ((planets.jupiter.rasiIndex - birthRasi + 12) % 12) + 1,
        venus: ((planets.venus.rasiIndex - birthRasi + 12) % 12) + 1,
        saturn: ((planets.saturn.rasiIndex - birthRasi + 12) % 12) + 1,
        rahu: ((nodes.rahu.rasiIndex - birthRasi + 12) % 12) + 1,
        ketu: ((nodes.ketu.rasiIndex - birthRasi + 12) % 12) + 1
    };

    const transitNakshatraIndex = Math.floor(transitMoonLong / (360 / 27));
    const phraseSelectorIndex = targetDay;

    // ==========================================================
    // 3. MATHEMATICAL WEIGHTED SYNTHESIS ENGINE (WITH VEDHA BLOCKS)
    // ==========================================================

    // --- CATEGORY A: CAREER ALGORITHM (Sun, Mars, Saturn) ---
    let careerScore = 0;
    
    if ([3, 6, 10, 11].includes(houseMap.sun)) {
        const isBlocked = checkPlanetaryVedha("sun", houseMap.sun, houseMap);
        careerScore += isBlocked ? 0 : 2; 
    } else {
        careerScore -= 1;
    }

    if ([3, 6, 11].includes(houseMap.mars)) {
        const isBlocked = checkPlanetaryVedha("mars", houseMap.mars, houseMap);
        careerScore += isBlocked ? 0 : 2;
    } else {
        careerScore -= 1;
    }

    if ([3, 6, 11].includes(houseMap.saturn)) {
        const isBlocked = checkPlanetaryVedha("saturn", houseMap.saturn, houseMap);
        careerScore += isBlocked ? 0 : 1;
    }
    if ([1, 2, 4, 7, 8, 12].includes(houseMap.saturn)) {
        careerScore -= 2;
    }

    let careerTier = "medium";
    if (careerScore >= 2) careerTier = "high";
    if (careerScore <= -2) careerTier = "low";
    
    let careerText = PHRASE_BANK.career[careerTier][phraseSelectorIndex % PHRASE_BANK.career[careerTier].length];

    if ([2, 4, 6, 8, 10, 11].includes(houseMap.mercury) && !checkPlanetaryVedha("mercury", houseMap.mercury, houseMap)) {
        const learningAddition = PHRASE_BANK.learning[phraseSelectorIndex % PHRASE_BANK.learning.length];
        careerText += ` Plus, ${learningAddition.toLowerCase()}`;
    }

    // --- CATEGORY B: FINANCE ALGORITHM (Jupiter, Venus, Rahu) ---
    let financeScore = 0;
    
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) {
        const isBlocked = checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap);
        financeScore += isBlocked ? 0 : 3;
    } else {
        financeScore -= 2;
    }

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) {
        const isBlocked = checkPlanetaryVedha("venus", houseMap.venus, houseMap);
        financeScore += isBlocked ? 0 : 1;
    } else {
        financeScore -= 1;
    }
    
    if ([3, 6, 11].includes(houseMap.rahu)) financeScore += 2;
    if ([2, 5, 8, 12].includes(houseMap.rahu)) financeScore -= 2;

    let financeTier = "medium";
    if (financeScore >= 2) financeTier = "high";
    if (financeScore <= -2) financeTier = "low";

    let financeText = PHRASE_BANK.finance[financeTier][phraseSelectorIndex % PHRASE_BANK.finance[financeTier].length];

    // --- CATEGORY C: VITALITY & RELATIONSHIPS ---
    let healthText = PHRASE_BANK.health[phraseSelectorIndex % PHRASE_BANK.health.length];
    if ([6, 8, 12].includes(houseMap.moon)) {
        healthText = "Energy levels require conservative management; avoid taking on unnecessary structural strain.";
    }
    const relationshipText = PHRASE_BANK.relationships[phraseSelectorIndex % PHRASE_BANK.relationships.length];

    // --- CATEGORY D: STRENGTHS, CAUTIONS & REMEDIES ---
    let strengthText = PHRASE_BANK.strengths[phraseSelectorIndex % PHRASE_BANK.strengths.length];
    if ([3, 6, 10, 11].includes(houseMap.sun) && [3, 6, 11].includes(houseMap.mars)) {
        const sunBlocked = checkPlanetaryVedha("sun", houseMap.sun, houseMap);
        const marsBlocked = checkPlanetaryVedha("mars", houseMap.mars, houseMap);
        if (!sunBlocked && !marsBlocked) {
            strengthText = `Peak operational execution. Bold but thoughtful decisions succeed.`;
        }
    }

    let cautionText = PHRASE_BANK.caution[phraseSelectorIndex % PHRASE_BANK.caution.length];
    if ([12, 1, 2, 8].includes(houseMap.saturn)) {
        cautionText = "Systemic delays or auditing bottlenecks demand strict validation. Review details before making decisions.";
    }

    const remedyText = PHRASE_BANK.spirituality[phraseSelectorIndex % PHRASE_BANK.spirituality.length];
    const guidanceMetrics = addonComputeGuidance(birthProfile.nakshatra.number, transitNakshatraIndex, careerTier, financeTier);

    const singleLineForecast = 
        `💼 CAREER: ${careerText}\n` +
        `💰 FINANCE: ${financeText}\n` +
        `🌱 VITALITY: ${healthText}\n` +
        `🤝 ALLIANCES: ${relationshipText}\n` +
        `⚡ STRENGTH: ${strengthText}\n` +
        `⚠️ CAUTION: ${cautionText}\n` +
        `🧘 REMEDY: ${remedyText}`;

    return {
        forecast: singleLineForecast,
        guidance: guidanceMetrics
    };
}

function addonComputeGuidance(birthNakshatraNum, transitBakshatraIndex, careerTier, financeTier) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const score = (distance % 9) || 9;
    const isFavorable = [2, 4, 6, 8, 9].includes(score) && careerTier !== "low";

    let dynamicColor = "Charcoal / Silver";
    if (isFavorable) {
        const colorMatrix = {
            2: "Saffron / Deep Gold (Bhagya)",
            4: "Emerald Green / Mint (Kshema)",
            6: "Royal Purple / Lavender (Sadhana)",
            8: "Pearl White / Rose Cream (Mitra)",
            9: "Bright Yellow / Amber (Param Mitra)"
        };
        dynamicColor = colorMatrix[score] || "Yellow / Cream";
    } else {
        const unfavorableMatrix = {
            1: "Crimson / Ruby Red (Janma Warning)",
            3: "Deep Ochre / Mustard (Vipat Risk)",
            5: "Steel Grey / Indigo (Pratyak Obstacle)",
            7: "Jet Black / Dark Umber (Vadha Restriction)"
        };
        dynamicColor = unfavorableMatrix[score] || "Charcoal / Silver";
    }

    return {
        luckyColor: dynamicColor,
        luckyNumber: isFavorable ? String((score * 3) % 9 || 9) : String((score * 2) % 7 || 3),
        goodTime: isFavorable ? "09:30 AM - 11:00 AM" : "02:15 PM - 03:45 PM",
        badTime: isFavorable ? "04:30 PM - 05:45 PM" : "07:30 AM - 09:00 AM",
        action: careerTier === "high" || financeTier === "high"
            ? "Great day to start new tasks, submit vital work, and hold key meetings." 
            : "Focus on organizing existing paperwork, background testing, and administrative cleanup."
    };
}