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
    
    // Check if current target date is a weekend (0 = Sunday, 6 = Saturday)
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
    const phraseSelectorIndex = targetDay;

    // Blended Calculations
    let jaiminiStatusPlanet = "sun";
    if (birthProfile.inputs?.day % 3 === 0) jaiminiStatusPlanet = "jupiter";
    if (birthProfile.inputs?.day % 3 === 1) jaiminiStatusPlanet = "mercury";

    const sunMarsDiff = Math.abs(planets.sun.longitude - planets.mars.longitude);
    const isWesternAspectTense = (sunMarsDiff >= 85 && sunMarsDiff <= 95) || (sunMarsDiff >= 175 && sunMarsDiff <= 185);

    // --- 1. CAREER (Concise & Simple) ---
    let careerScore = 0;
    if ([3, 6, 10, 11].includes(houseMap.sun)) careerScore += checkPlanetaryVedha("sun", houseMap.sun, houseMap) ? 0 : 2; 
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.mars)) careerScore += checkPlanetaryVedha("mars", houseMap.mars, houseMap) ? 0 : 2;
    else careerScore -= 1;

    if ([3, 6, 11].includes(houseMap.saturn)) careerScore += checkPlanetaryVedha("saturn", houseMap.saturn, houseMap) ? 0 : 1;
    if ([1, 2, 4, 7, 8, 12].includes(houseMap.saturn)) careerScore -= 2;

    let careerText = "";
    if (isWeekend) {
        careerText = "Unplug from work today. Focus on your personal energy and recharge.";
    } else {
        if (careerScore >= 2) careerText = "Great energy for work. Tasks will flow easily and progress comes quickly.";
        else if (careerScore <= -2) careerText = "Work might feel a bit slow or demanding. Keep your head down and stay patient.";
        else careerText = "A steady, routine workday. Focus on your regular duties and avoid rash changes.";
    }

    // --- 2. FINANCE (Concise & Simple) ---
    let financeScore = 0;
    if ([2, 5, 7, 9, 11].includes(houseMap.jupiter)) financeScore += checkPlanetaryVedha("jupiter", houseMap.jupiter, houseMap) ? 0 : 3;
    else financeScore -= 2;

    if ([1, 2, 3, 4, 5, 8, 9, 11, 12].includes(houseMap.venus)) financeScore += checkPlanetaryVedha("venus", houseMap.venus, houseMap) ? 0 : 1;
    else financeScore -= 1;

    let financeText = "";
    if (financeScore >= 2) financeText = "Favorable day for money matters. Gains and good opportunities are highlighted.";
    else if (financeScore <= -2) financeText = "Watch your expenses today. Avoid impulsive buying or lending money.";
    else financeText = "Balanced financial day. Stick to your budget and avoid unnecessary risks.";

    // --- 3. FAMILY & EMOTIONS ---
    let familyText = "Harmonious energy at home. Good day for heartfelt conversations.";
    if ([6, 8, 12].includes(houseMap.moon)) {
        familyText = "You may feel a bit sensitive or misunderstood today. Speak gently with loved ones.";
    }

    // --- 4. CAUTION & FORWARD-LOOKING TRANSIT WARNING ENGINE ---
    let cautionText = "Keep your mind calm and avoid rushing through important tasks.";

    // Check 2-Day Ahead Transit Warning System
    const futureDate = new Date(targetDate);
    futureDate.setDate(futureDate.getDate() + 2);
    const futurePlanets = await calculateMajorPlanetsTransit(futureDate);
    const futureSunMarsDiff = Math.abs(futurePlanets.sun.longitude - futurePlanets.mars.longitude);
    const isFutureTense = (futureSunMarsDiff >= 85 && futureSunMarsDiff <= 95) || (futureSunMarsDiff >= 175 && futureSunMarsDiff <= 185);

    if (isWesternAspectTense) {
        cautionText = "Spikes in stress or conflicts are likely today. Pause before reacting.";
    } else if ([12, 1, 2].includes(houseMap.saturn)) {
        cautionText = "Expect minor delays or bottlenecks. Double-check your details.";
    }

    // Append 2-Day Advance Alert Badge if a shift is approaching
    if (isFutureTense) {
        cautionText = `<span style="color:#ff6b6b; font-weight:bold;">⚠️ UPCOMING WARNING (Next 2 Days):</span> Heavy planetary shift approaching. Avoid major risks or disputes in the coming days.<br>${cautionText}`;
    }

    if (isWeekend) {
        cautionText = "Guard your peace. Avoid letting unresolved work thoughts enter your home life.";
    }

    // Remedial note for guidance
    const remedyText = "Light a lamp or spend 5 minutes in quiet meditation to align your thoughts.";

    const guidanceMetrics = addonComputeGuidance(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        careerScore >= 2 ? "high" : "medium", 
        financeScore >= 2 ? "high" : "medium", 
        isWesternAspectTense ? "Risk Alert" : "Clear", 
        "", 
        remedyText
    );

    // Short, scannable forecast output
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

    // Jargon-Free Hora Activity Windows
    let horaActivityStr = "Strategy & Focus Window (11:00 AM - 12:30 PM) — Best for planning and reviewing details.";
    if (isFavorable) {
        horaActivityStr = "Business & Projects Window (09:30 AM - 11:00 AM) — Best for pitch presentations, key decisions, and closing deals.";
    } else if (score === 3 || score === 5) {
        horaActivityStr = "Rest & Reflection Window (02:15 PM - 03:45 PM) — Best to delay major announcements or big commitments.";
    }

    // Daily Micro-Remedy
    const remedyList = [
        "Take 2 minutes of quiet breathing at mid-day to maintain emotional focus.",
        "Wear shades of green or light yellow to balance personal energy today.",
        "Spend 5 minutes outdoors in the morning sunlight before starting work.",
        "Keep a glass of water on your desk and stay consistently hydrated.",
        "Clear desk clutter before beginning high-priority tasks today."
    ];
    const microRemedyStr = remedyList[(birthNakshatraNum + score) % remedyList.length];

    return {
        luckyColor: dynamicColor,
        luckyNumber: isFavorable ? String((score * 3) % 9 || 9) : String((score * 2) % 7 || 3),
        goodTime: goodTimeStr,
        badTime: badTimeStr,
        horaWindow: horaActivityStr,      // <--- Jargon-free activity timing
        microRemedy: microRemedyStr,      // <--- Micro remedy string
        transitStatus: transitStatusText,
        transitTips: transitTipsText,
        cautionNote: cautionNoteText
    };
}