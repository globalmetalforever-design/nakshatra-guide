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
    
    // Dynamic daily selector seed to avoid phrase repetition
    const seed = (targetDay + targetMonth * 7 + (birthProfile.inputs?.day || 1)) % 100;

    // --- 1. CAREER (Rich & Emotionally Resonant) ---
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

    let careerText = "";
    if (isWeekend) {
        careerText = "Step back from external ambitions today. Give yourself permission to disconnect from the urgency of production, honor your mental reserves, and allow your deeper creative intuition to quietly recharge.";
    } else {
        const pool = PHRASE_BANK.career[careerTier] || [];
        careerText = pool[seed % pool.length];
        
        // Contextual depth extension
        if (careerTier === "high") {
            careerText += " Your focus is exceptionally aligned right now; what you initiate carries natural authority and commands quiet respect.";
        } else if (careerTier === "low") {
            careerText += " Do not misinterpret temporary stagnation as personal regression. Protect your peace from demanding egos and let non-essential deadlines wait.";
        } else {
            careerText += " Use this balanced rhythm to refine the finer details of your craft. Small, steady efforts made in silence today will shield you against future turbulence.";
        }
    }

    // --- 2. FINANCE (Grounding & Psychological Depth) ---
    let financeScore = 0;
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) financeScore += checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap) ? 0 : 3;
    else financeScore -= 2;

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) financeScore += checkPlanetaryVedha("venus", houseMap.venus, houseMap) ? 0 : 1;
    else financeScore -= 1;

    let financeTier = "medium";
    if (financeScore >= 2) financeTier = "high";
    else if (financeScore <= -2) financeTier = "low";

    const finPool = PHRASE_BANK.finance[financeTier] || [];
    let financeText = finPool[(seed + 1) % finPool.length];

    if (financeTier === "high") {
        financeText += " An instinct for long-term security replaces reactive scarcity fears; trust your discernment when organizing investments or budgeting for what truly matters.";
    } else if (financeTier === "low") {
        financeText += " Guard against emotional spending used as a coping mechanism today. Slow down before hitting approve on large transactions or extending loans.";
    } else {
        financeText += " A quiet audit of your recurring commitments and resource streams brings profound mental clarity and emotional grounding.";
    }

    // --- 3. FAMILY & EMOTIONS (Heartfelt & Empathetic) ---
    const famPool = PHRASE_BANK.family || [];
    let familyText = famPool[(seed + 2) % famPool.length];

    if ([6, 8, 12].includes(houseMap.moon)) {
        familyText = "The transit Moon creates a sensitive emotional undertone today. You may feel a bit emotionally unguarded or misunderstood by loved ones. Soften your communication, resist taking offhand comments to heart, and offer the same patience you secretly hope to receive.";
    } else if ([4, 5, 9].includes(houseMap.moon)) {
        familyText = "A comforting and protective energy wraps around your domestic sphere today. Heart-to-heart conversations bridge subtle gaps effortlessly; making space to listen deeply brings immense warmth back into your home.";
    }

    // --- 4. CAUTION & FORWARD-LOOKING TRANSIT ALERT ---
    const sunMarsDiff = Math.abs(planets.sun.longitude - planets.mars.longitude);
    const isWesternAspectTense = (sunMarsDiff >= 85 && sunMarsDiff <= 95) || (sunMarsDiff >= 175 && sunMarsDiff <= 185);

    let cautionText = "";
    if (isWesternAspectTense) {
        cautionText = "Subconscious friction or sudden spikes in impatience are active. Resist the urge to enter disputes to prove a point; silence and composure are your greatest armor today.";
    } else if ([12, 1, 2].includes(houseMap.saturn)) {
        cautionText = "Saturn asks for methodical endurance. Delays or bureaucratic sluggishness might test your nerves; stay grounded in your routine and refuse to rush what needs time to mature.";
    } else {
        const cautionPool = PHRASE_BANK.caution || [];
        cautionText = cautionPool[(seed + 3) % cautionPool.length];
    }

    // 2-Day Ahead Transit Warning Engine
    const futureDate = new Date(targetDate);
    futureDate.setDate(futureDate.getDate() + 2);
    const futurePlanets = await calculateMajorPlanetsTransit(futureDate);
    const futureSunMarsDiff = Math.abs(futurePlanets.sun.longitude - futurePlanets.mars.longitude);
    const isFutureTense = (futureSunMarsDiff >= 85 && futureSunMarsDiff <= 95) || (futureSunMarsDiff >= 175 && futureSunMarsDiff <= 185);

    if (isFutureTense) {
        cautionText = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ UPCOMING WARNING (Next 2 Days):</span> An intense planetary clash is approaching. Wrap up pending tasks early and postpone high-stakes arguments or financial commitments.<br><br>${cautionText}`;
    }

    if (isWeekend) {
        cautionText += " Protect your weekend boundaries fiercely—do not let unresolved external anxieties invade your personal sanctuary.";
    }

    // Remedial Guidance
    const spiritPool = PHRASE_BANK.spirituality || [];
    const remedyText = spiritPool[seed % spiritPool.length];

    const guidanceMetrics = addonComputeGuidance(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        careerTier, 
        financeTier, 
        isWesternAspectTense ? "Risk Alert" : "Clear", 
        "", 
        remedyText
    );

    // Formatted, rich output
    const singleLineForecast = 
        `<strong style="color: #ffffff !important; font-weight: bold !important;">💼 CAREER & PURPOSE:</strong><br>${careerText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">💰 WEALTH & SECURITY:</strong><br>${financeText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">👨‍👩‍👧‍👦 INNER CIRCLE & EMOTIONS:</strong><br>${familyText}<br><br>` +
        `<strong style="color: #ffffff !important; font-weight: bold !important;">⚠️ MINDFULNESS & CAUTION:</strong><br>${cautionText}`;

    return {
        forecast: singleLineForecast,
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