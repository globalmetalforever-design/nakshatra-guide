// Addons/js/time_lock_addon.js
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

    // 1. Fetch current planetary positions
    const nodes = await calculateNodesTransit(targetDate);
    const planets = await calculateMajorPlanetsTransit(targetDate);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    
    // Weekend check
    const dayOfWeek = targetDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    // CALIBRATED TO MIDNIGHT IST
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
    const seed = (targetDay + targetMonth * 7 + (birthProfile.inputs?.day || 1)) % 100;

    // --- 1. CAREER EVALUATION ---
    let careerScore = 0;
    if ([3, 6, 10, 11].includes(houseMap.sun)) careerScore += checkPlanetaryVedha("sun", houseMap.sun, houseMap) ? 0 : 2; 
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.mars)) careerScore += checkPlanetaryVedha("mars", houseMap.mars, houseMap) ? 0 : 2;
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.saturn)) careerScore += checkPlanetaryVedha("saturn", houseMap.saturn, houseMap) ? 0 : 1;
    if ([1, 2, 4, 7, 8, 12].includes(houseMap.saturn)) careerScore -= 2;

    let careerTier = "medium";
    if (careerScore >= 2) careerTier = "high";
    else if (careerScore <= -2) careerTier = "low";

    // --- 2. FINANCE EVALUATION ---
    let financeScore = 0;
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) financeScore += checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap) ? 0 : 3;
    else financeScore -= 2;

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) financeScore += checkPlanetaryVedha("venus", houseMap.venus, houseMap) ? 0 : 1;
    else financeScore -= 1;

    let financeTier = "medium";
    if (financeScore >= 2) financeTier = "high";
    else if (financeScore <= -2) financeTier = "low";

    // --- EXTRACT CONCISE SENTENCES FROM PHRASE BANK ---
    // Take the primary sentence from each section without long trailing extensions
    const careerPool = PHRASE_BANK.career[careerTier] || [];
    const rawCareer = careerPool[seed % careerPool.length] || "A steady rhythm supports your key efforts today.";
    const careerCoreSentence = rawCareer.split('.')[0] + ".";

    const finPool = PHRASE_BANK.finance[financeTier] || [];
    const rawFinance = finPool[(seed + 1) % finPool.length] || "Resource flows remain balanced.";
    const financeCoreSentence = rawFinance.split('.')[0] + ".";

    let emotionalSentence = "";
    if ([6, 8, 12].includes(houseMap.moon)) {
        emotionalSentence = "Keep personal interactions gentle, as the Moon brings heightened emotional sensitivity.";
    } else {
        const famPool = PHRASE_BANK.family || [];
        const rawFam = famPool[(seed + 2) % famPool.length] || "A supportive environment anchors your home sphere.";
        emotionalSentence = rawFam.split('.')[0] + ".";
    }

    // --- PARAGRAPH 1: CONCISE BLENDED SUMMARY (NO HEADINGS) ---
    let mainParagraph = "";
    if (isWeekend) {
        mainParagraph = `Step back from professional pressure today and give your energy room to recharge. ${financeCoreSentence} ${emotionalSentence}`;
    } else {
        mainParagraph = `${careerCoreSentence} ${financeCoreSentence} ${emotionalSentence}`;
    }

    // --- PARAGRAPH 2: CAUTION SUB-HEAD ---
    const sunMarsDiff = Math.abs(planets.sun.longitude - planets.mars.longitude);
    const isWesternAspectTense = (sunMarsDiff >= 85 && sunMarsDiff <= 95) || (sunMarsDiff >= 175 && sunMarsDiff <= 185);

    let cautionBody = "";
    if (isWesternAspectTense) {
        cautionBody = "Spikes in impatience are likely today; pause before reacting and avoid entering unnecessary disputes.";
    } else if ([12, 1, 2].includes(houseMap.saturn)) {
        cautionBody = "Delays or bureaucratic sluggishness may test your patience; stay steady and avoid rushing critical details.";
    } else {
        const cautionPool = PHRASE_BANK.caution || [];
        const rawCaution = cautionPool[(seed + 3) % cautionPool.length] || "Guard your inner peace and verify details before making firm commitments.";
        cautionBody = rawCaution.split('.')[0] + ".";
    }

    // 2-Day Ahead Transit Warning Alert Check
    const futureDate = new Date(targetDate);
    futureDate.setDate(futureDate.getDate() + 2);
    const futurePlanets = await calculateMajorPlanetsTransit(futureDate);
    const futureSunMarsDiff = Math.abs(futurePlanets.sun.longitude - futurePlanets.mars.longitude);
    const isFutureTense = (futureSunMarsDiff >= 85 && futureSunMarsDiff <= 95) || (futureSunMarsDiff >= 175 && futureSunMarsDiff <= 185);

    if (isFutureTense) {
        cautionBody = `A tense planetary shift is approaching over the next 48 hours. Wrap up important tasks early. ${cautionBody}`;
    }

    if (isWeekend) {
        cautionBody += " Keep work-related anxieties away from your personal sanctuary.";
    }

    const cautionParagraph = `<span style="font-weight: bold; text-decoration: underline; color: #ffd700;">CAUTION:</span> ${cautionBody}`;

    // Combine into two paragraphs separated by a paragraph break
    const formattedForecast = `<p style="margin: 0 0 12px 0; line-height: 1.6;">${mainParagraph}</p><p style="margin: 0; line-height: 1.6;">${cautionParagraph}</p>`;

    // --- GUIDANCE METRICS ---
    const spiritPool = PHRASE_BANK.spirituality || [];
    const rawRemedy = spiritPool[seed % spiritPool.length] || "Take 2 minutes of quiet breathing to align your focus.";
    const remedyText = rawRemedy.split('.')[0] + ".";

    const guidanceMetrics = addonComputeGuidance(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        careerTier, 
        financeTier, 
        isWesternAspectTense ? "Risk Alert" : "Clear", 
        "", 
        remedyText
    );

    return {
        forecast: formattedForecast,
        guidance: guidanceMetrics
    };
}

function addonComputeGuidance(birthNakshatraNum, transitBakshatraIndex, careerTier, financeTier, transitStatusText, transitTipsText, cautionNoteText) {
    const transitNakshatraNum = transitBakshatraIndex + 1;
    const distance = ((transitNakshatraNum - birthNakshatraNum + 27) % 27) + 1;
    const score = (distance % 9) || 9;
    const isFavorable = [2, 4, 6, 8, 9].includes(score) && careerTier !== "low";

    let dynamicColor = "Charcoal / Silver";
    if (isFavorable) {
        const colorMatrix = {
            2: "Saffron / Deep Gold", 4: "Emerald Green / Mint",
            6: "Royal Purple / Lavender", 8: "Pearl White / Rose Cream",
            9: "Bright Yellow / Amber"
        };
        dynamicColor = colorMatrix[score] || "Yellow / Cream";
    } else {
        const unfavorableMatrix = {
            1: "Crimson / Ruby Red", 3: "Deep Ochre / Mustard",
            5: "Steel Grey / Indigo", 7: "Jet Black / Dark Umber"
        };
        dynamicColor = unfavorableMatrix[score] || "Charcoal / Silver";
    }

    let goodTimeStr = isFavorable ? "09:30 AM - 11:00 AM" : "02:15 PM - 03:45 PM";
    let badTimeStr = isFavorable ? "04:30 PM - 05:45 PM" : "07:30 AM - 09:00 AM";
    if (score === 4 || score === 9) {
        goodTimeStr = "08:15 AM - 10:45 AM (Auspicious Peak)";
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