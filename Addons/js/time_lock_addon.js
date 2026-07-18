import { getSwiss, normalizeDegrees } from "../../js/birth_engine.js?v=103";
import { calculateNodesTransit } from "./panchanga_limbs/nodes_engine.js";
import { calculateMajorPlanetsTransit } from "./panchanga_limbs/planets_engine.js";
import { PHRASE_BANK } from "./panchanga_limbs/phrase_bank_addon.js";
import { checkPlanetaryVedha } from "./panchanga_limbs/vedha_addon.js?v=103";

export async function generateTimeLockedForecast(birthProfile, targetDate = new Date()) {
    if (!birthProfile || !birthProfile.nakshatra) {
        return {
            forecast: "Please enter your birth profile details.",
            guidance: { luckyColor: "-", luckyNumber: "-", goodTime: "-", badTime: "-", action: "-" }
        };
    }

    const swe = await getSwiss();

    // 1. Fetch planetary positions
    const nodes = await calculateNodesTransit(targetDate);
    const planets = await calculateMajorPlanetsTransit(targetDate);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    
    // CALIBRATED TO MIDNIGHT IST: Bypasses early morning overlaps perfectly
    const targetHourUTC = -5.5; 

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

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

    // Blended Calculations
    let jaiminiStatusPlanet = "sun";
    if (birthProfile.inputs?.day % 3 === 0) jaiminiStatusPlanet = "jupiter";
    if (birthProfile.inputs?.day % 3 === 1) jaiminiStatusPlanet = "mercury";

    const sunMarsDiff = Math.abs(planets.sun.longitude - planets.mars.longitude);
    const isWesternAspectTense = (sunMarsDiff >= 85 && sunMarsDiff <= 95) || (sunMarsDiff >= 175 && sunMarsDiff <= 185);

    // --- CAREER ---
    let careerScore = 0;
    if ([3, 6, 10, 11].includes(houseMap.sun)) careerScore += checkPlanetaryVedha("sun", houseMap.sun, houseMap) ? 0 : 2; 
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.mars)) careerScore += checkPlanetaryVedha("mars", houseMap.mars, houseMap) ? 0 : 2;
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.saturn)) careerScore += checkPlanetaryVedha("saturn", houseMap.saturn, houseMap) ? 0 : 1;
    if ([1, 2, 4, 7, 8, 12].includes(houseMap.saturn)) careerScore -= 2;
    if (jaiminiStatusPlanet === "jupiter" && [2, 5, 7, 9, 11].includes(houseMap.jupiter)) careerScore += 1; 

    let careerTier = "medium";
    if (careerScore >= 2) careerTier = "high";
    if (careerScore <= -2) careerTier = "low";
    
    let careerText = PHRASE_BANK.career[careerTier][phraseSelectorIndex % PHRASE_BANK.career[careerTier].length];
    if ([2, 4, 6, 8, 10, 11].includes(houseMap.mercury) && !checkPlanetaryVedha("mercury", houseMap.mercury, houseMap)) {
        const learningAddition = PHRASE_BANK.learning[phraseSelectorIndex % PHRASE_BANK.learning.length];
        careerText += ` Plus, ${learningAddition.toLowerCase()}`;
    }

    // --- FINANCE ---
    let financeScore = 0;
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) financeScore += checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap) ? 0 : 3;
    else financeScore -= 2;

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) financeScore += checkPlanetaryVedha("venus", houseMap.venus, houseMap) ? 0 : 1;
    else financeScore -= 1;
    
    if ([3, 6, 11].includes(houseMap.rahu)) financeScore += 2;
    if ([2, 5, 8, 12].includes(houseMap.rahu)) financeScore -= 2;
    if (isWesternAspectTense) financeScore -= 1; 

    let financeTier = "medium";
    if (financeScore >= 2) financeTier = "high";
    if (financeScore <= -2) financeTier = "low";

    let financeText = PHRASE_BANK.finance[financeTier][phraseSelectorIndex % PHRASE_BANK.finance[financeTier].length];

   // --- HEALTH & FAMILY ---
    let healthText = PHRASE_BANK.health[phraseSelectorIndex % PHRASE_BANK.health.length];
    if ([6, 8, 12].includes(houseMap.moon) || isWesternAspectTense) {
        healthText = "Energy levels require conservative management; your nervous system is working overtime. Avoid taking on unnecessary structural strain.";
    }
    
    // VERIFIED: Strictly references the new family key map we defined
    const familyText = PHRASE_BANK.family[phraseSelectorIndex % PHRASE_BANK.family.length];

    // --- STRENGTHS, CAUTIONS & REMEDIES ---
    // --- STRENGTHS & CAUTIONS ---
    // --- STRENGTHS & CAUTIONS ---
    let strengthText = PHRASE_BANK.strengths[phraseSelectorIndex % PHRASE_BANK.strengths.length];
    
    let cautionText = PHRASE_BANK.caution[phraseSelectorIndex % PHRASE_BANK.caution.length];
    if ([12, 1, 2, 8].includes(houseMap.saturn)) {
        cautionText = "Systemic delays or auditing bottlenecks demand strict validation. Review critical data before making decisions.";
    }

    // DYNAMIC TRANSIT WARNING INJECTION
    if (isWesternAspectTense) {
        cautionText = `${PHRASE_BANK.alerts.marsSunFriction} Moreover, ${cautionText.toLowerCase()}`;
    } else if ([12, 1, 2].includes(houseMap.saturn)) {
        cautionText = `${PHRASE_BANK.alerts.saturnSadeSati} Crucially, ${cautionText.toLowerCase()}`;
    } else if ([6, 8, 12].includes(houseMap.moon)) {
        cautionText = `${PHRASE_BANK.alerts.moonStagnation} Additionally, ${cautionText.toLowerCase()}`;
    }

      // Determine target texts for transit statuses
    const activeTransitStatus = isWesternAspectTense ? "Risk Alert" : ([12, 1, 2].includes(houseMap.saturn) ? "Saturn Audit" : "Clear");
    const activeTransitTips = isWesternAspectTense 
        ? "Avoid signing guarantees, legal commitments, or loaning funds. Volatility is running high; buy 48 hours before locking financial moves."
        : ([12, 1, 2].includes(houseMap.saturn) 
            ? "Expect administrative bottlenecks or timeline adjustments. Double-check structural records and audit metrics before submitting."
            : "Cosmic weather is uninhibited. Proceed with execution routines, launch key plans, and advance existing configurations smoothly.");

    // Pull the Lal Kitab daily Upaya alignment action string
    const remedyText = PHRASE_BANK.spirituality[phraseSelectorIndex % PHRASE_BANK.spirituality.length];

    // Compute all guidance metrics cleanly by passing only what's needed
    const guidanceMetrics = addonComputeGuidance(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        careerTier, 
        financeTier, 
        activeTransitStatus, 
        activeTransitTips, 
        remedyText
    );

    // Formatted single-line forecast: Strictly critical pillars only
    const singleLineForecast = 
        `<strong style="color: #ffffff !important; font-weight: bold !important;">💼 CAREER:</strong> ${careerText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">💰 FINANCE:</strong> ${financeText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">👨‍👩‍👧‍👦 FAMILY:</strong> ${familyText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">⚠️ CAUTION:</strong> ${cautionText}`;

    return {
        forecast: singleLineForecast,
        guidance: guidanceMetrics
    };
}

// Updated Helper Function to perfectly process and scope all dashboard outputs
// Updated Helper Function to cleanly process outputs without any Strategic Focus remnants
function addonComputeGuidance(birthNakshatraNum, transitBakshatraIndex, careerTier, financeTier, transitStatusText, transitTipsText, cautionNoteText) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const score = (distance % 9) || 9;
    const isFavorable = [2, 4, 6, 8, 9].includes(score) && careerTier !== "low";

    let dynamicColor = "Charcoal / Silver";
    if (isFavorable) {
        const colorMatrix = {
            2: "Saffron / Deep Gold",
            4: "Emerald Green / Mint",
            6: "Royal Purple / Lavender",
            8: "Pearl White / Rose Cream",
            9: "Bright Yellow / Amber"
        };
        dynamicColor = colorMatrix[score] || "Yellow / Cream";
    } else {
        const unfavorableMatrix = {
            1: "Crimson / Ruby Red",
            3: "Deep Ochre / Mustard",
            5: "Steel Grey / Indigo",
            7: "Jet Black / Dark Umber"
        };
        dynamicColor = unfavorableMatrix[score] || "Charcoal / Silver";
    }

    let goodTimeStr = isFavorable ? "09:30 AM - 11:00 AM" : "02:15 PM - 03:45 PM";
    let badTimeStr = isFavorable ? "04:30 PM - 05:45 PM" : "07:30 AM - 09:00 AM";
    if (score === 4 || score === 9) {
        goodTimeStr = "08:15 AM - 10:45 AM (Sub-Lord Auspicious Peak)";
    }

    return {
        luckyColor: dynamicColor,
        luckyNumber: isFavorable ? String((score * 3) % 9 || 9) : String((score * 2) % 7 || 3),
        goodTime: goodTimeStr,
        badTime: badTimeStr,
        transitStatus: transitStatusText,
        transitTips: transitTipsText,
        cautionNote: cautionNoteText
    };
}
