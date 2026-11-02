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
            guidance: { luckyColor: "-", goodTime: "-", badTime: "-" }
        };
    }

    const swe = await getSwiss();

    // 1. Planetary Transits
    const nodes = await calculateNodesTransit(targetDate);
    const planets = await calculateMajorPlanetsTransit(targetDate);
    
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    
    const dayOfWeek = targetDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
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

    // Career Score
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

    // Finance Score
    let financeScore = 0;
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) financeScore += checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap) ? 0 : 3;
    else financeScore -= 2;

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) financeScore += checkPlanetaryVedha("venus", houseMap.venus, houseMap) ? 0 : 1;
    else financeScore -= 1;

    let financeTier = "medium";
    if (financeScore >= 2) financeTier = "high";
    else if (financeScore <= -2) financeTier = "low";

    // Build Concise Sentences
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

    let singleParagraphForecast = "";
    if (isWeekend) {
        singleParagraphForecast = `Step back from professional pressure today and give your energy room to recharge. ${financeCoreSentence} ${emotionalSentence}`;
    } else {
        singleParagraphForecast = `${careerCoreSentence} ${financeCoreSentence} ${emotionalSentence}`;
    }

    const guidanceMetrics = addonComputeGuidance(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        careerTier
    );

    return {
        forecast: `<p style="margin: 0; line-height: 1.7;">${singleParagraphForecast}</p>`,
        guidance: guidanceMetrics
    };
}

function addonComputeGuidance(birthNakshatraNum, transitBakshatraIndex, careerTier) {
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
        goodTime: goodTimeStr,
        badTime: badTimeStr
    };
}