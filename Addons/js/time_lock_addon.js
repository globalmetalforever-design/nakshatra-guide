import { getSwiss, normalizeDegrees, toUtcDateParts } from "../../js/birth_engine.js?v=100";
import { calculateVaraAndYoga } from "./panchanga_limbs/vara_yoga_addon.js";
import { calculateKarana } from "./panchanga_limbs/karana_addon.js";
import { calculateNodesTransit } from "./panchanga_limbs/nodes_engine.js";
import { calculateMajorPlanetsTransit } from "./panchanga_limbs/planets_engine.js";

/**
 * Addon Module: Generates a highly accurate transit forecast fixed precisely 
 * to 7:00 AM Indian Standard Time (IST) for any selected target calendar date,
 * incorporating dynamic Tithi, Vara, Yoga, Karana, and Rahu/Ketu configurations.
 */
export async function generateTimeLockedForecast(birthProfile, targetDate = new Date()) {
    if (!birthProfile || !birthProfile.nakshatra) {
        return {
            forecast: "Please enter your birth profile details.",
            attention: "Birth details required.",
            guidance: { luckyColor: "-", luckyNumber: "-", goodTime: "-", badTime: "-", action: "-" }
        };
    }

    const swe = await getSwiss();

    // Calculate dynamic node positions
    const nodes = await calculateNodesTransit(targetDate);

    // Calculate house positions relative to the user's birth Rasi
    const rahuHouse = ((nodes.rahu.rasiIndex - birthProfile.rasi.number + 12) % 12) + 1;
    const ketuHouse = ((nodes.ketu.rasiIndex - birthProfile.rasi.number + 12) % 12) + 1;
    // Calculate dynamic node positions
    const nodes = await calculateNodesTransit(targetDate);

    // NEW: Calculate all major planetary positions simultaneously
    const planets = await calculateMajorPlanetsTransit(targetDate);
    const targetYear = targetDate.getFullYear();
    const targetMonth = targetDate.getMonth() + 1;
    const targetDay = targetDate.getDate();
    const targetHourUTC = 1.5; 

    const julianDay = swe.julday(targetYear, targetMonth, targetDay, targetHourUTC);

    const siderealSun = swe.calc_ut(julianDay, swe.SE_SUN, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    const siderealMoon = swe.calc_ut(julianDay, swe.SE_MOON, swe.SEFLG_SWIEPH | swe.SEFLG_SPEED | swe.SEFLG_SIDEREAL);
    
    const transitSunLong = normalizeDegrees(siderealSun[0]);
    const transitMoonLong = normalizeDegrees(siderealMoon[0]);

    // 1. Dynamic Tithi Engine
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

    // 2. Dynamic Auxiliary Limb Engine Executions
    const varaYogaLimbs = await calculateVaraAndYoga(targetDate);
    const karanaLimb = await calculateKarana(targetDate);

    const transitNakshatraIndex = Math.floor(transitMoonLong / (360 / 27));

    // Calculate node text traits to append inside the forecast assembler
    const nodeInfluences = computeNodeTraits(rahuHouse, ketuHouse);

    // 3. Compute text assets via the expanded mapping engines
    const forecastText = addonComputeForecast(
        birthProfile.nakshatra.number, 
        transitNakshatraIndex, 
        tithiName, 
        varaYogaLimbs.vara, 
        varaYogaLimbs.yoga,
        karanaLimb.karana,
        nodeInfluences
    );

    const attentionText = addonComputeAttention(birthProfile.rasi.number, transitMoonLong);
    const guidanceMetrics = addonComputeGuidance(birthProfile.nakshatra.number, transitNakshatraIndex);

    return {
        forecast: forecastText,
        attention: attentionText,
        guidance: guidanceMetrics
    };
}

function addonComputeForecast(birthNakshatraNum, transitBakshatraIndex, tithiString, varaString, yogaString, karanaString, nodeInfluences) {
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
    
    const varaTraitMap = {
        "Ravivara (Sunday)": "Solar vitality encourages high structural authority and planning macro strategies.",
        "Somavara (Monday)": "Lunar rhythms optimize emotional intelligence, public outreach, and creative conception.",
        "Mangalavara (Tuesday)": "Martial focus provides intense energy for clearing heavy backlogs and operational debugging.",
        "Budhavara (Wednesday)": "Mercurial currents highly optimize mathematical transactions, contracts, and technical study.",
        "Guruvara (Thursday)": "Jupiterian expansion favors financial audits, wisdom cultivation, and consultations.",
        "Sukravara (Friday)": "Venusian properties enhance strategic aesthetics, alliance forging, and design processes.",
        "Sanivara (Saturday)": "Saturnian discipline demands rigorous verification, systemic sorting, and patient execution."
    };

    const yogaTraitMap = {
        "Vishkumbha": "Maintain boundaries against minor transactional frictions.",
        "Priti": "Harmonious connection vectors facilitate communication channels.",
        "Ayushman": "Vitality structures support steady, health-focused execution.",
        "Saubhagya": "Supportive ambient elements elevate productivity metrics.",
        "Shobhana": "Aesthetic refinement and intellectual clarity remain high.",
        "Atiganda": "Navigate strategic bottlenecks with calculated deliberation.",
        "Sukarma": "Constructive work parameters flow cleanly to final targets.",
        "Dhriti": "High patient endurance assists in auditing complex files.",
        "Shula": "Resolve internal project operational challenges directly.",
        "Ganda": "Review core infrastructure assets for minor technical bugs.",
        "Vridhi": "Compounding progression optimizes creative expansion.",
        "Dhruva": "Stable foundational states support locked-in milestones.",
        "Vyaghata": "Safeguard assets against temporary workflow disruptions.",
        "Harshana": "Dynamic execution velocity accelerates task completions.",
        "Vajra": "Unwavering determination cuts cleanly through backlogs.",
        "Siddhi": "Functional expertise yields measurable execution gains.",
        "Vyatipata": "Decline heavy forward commitments; execute cleanup maps.",
        "Variyan": "Operational resources organize fluidly behind milestones.",
        "Parigha": "Consolidate structural positions against external inputs.",
        "Shiva": "Pure meditative focus assists in master-planning tasks.",
        "Siddha": "Pre-calibrated operational templates lock into place easily.",
        "Sadhya": "Methodical research pipelines secure measurable breakthroughs.",
        "Shubha": "Auspicious execution fields protect long-range goals.",
        "Shukla": "High visual clarity supports clean presentation reviews.",
        "Brahma": "Creative architectural structuring matches creative ideals.",
        "Indra": "Administrative oversight and managerial tasks excel.",
        "Vaidhriti": "Internalize focus; clean up underlying ledger databases."
    };

    const karanaTraitMap = {
        "Bava": "Productive, action-oriented energy favors professional execution vectors.",
        "Balava": "Nurturing and developmental tasks find smooth progress fields.",
        "Kaulava": "Social alliances, networking connections, and partnership dynamics excel.",
        "Taitila": "Strategic flexibility helps you adapt to unexpected administrative shifts.",
        "Gara": "Meticulous structural formatting and manual data tuning yield solid results.",
        "Vanija": "Commercial negotiations, inventory updates, and trading agreements are favored.",
        "Vishti": "A heavy energy frame. Delay crucial launches; focus on debugging and defensive cleanup tasks.",
        "Shakuni": "Analytical review, diagnostic tests, and legal documentation are optimized.",
        "Chatushpada": "Grounding tasks, asset preservation strategies, and physical audits flow cleanly.",
        "Naga": "Deep research parameters, auditing hidden logs, and structural work excel.",
        "Kintughna": "Favorable framework for launching educational milestones or initial conceptual plans."
    };

    const coreForecast = guidanceMap[tarabalaCategory] || "Steady alignments tracking across this transit block.";
    const varaTrait = varaTraitMap[varaString] || "Baseline solar tracking rules apply.";
    const yogaTrait = yogaTraitMap[yogaString] || "Baseline energetic alignments apply.";
    const karanaTrait = karanaTraitMap[karanaString] || "Baseline operational parameters apply.";

    return `${tithiString} • ${varaString} • ${yogaString} Yoga • ${karanaString} Karana\n\n${coreForecast}\n\n${varaTrait} ${yogaTrait} ${karanaTrait}\n\n${nodeInfluences}`;
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

function computeNodeTraits(rahuHouse, ketuHouse) {
    let traits = "";
    if (rahuHouse === 3 || rahuHouse === 6 || rahuHouse === 11) {
        traits += "Rahu is in a favorable transit house, generating competitive breakthroughs and sudden gains. ";
    } else {
        traits += "Rahu's transit counsels guarding against over-ambition or illusionary commitments in focal sectors. ";
    }

    if (ketuHouse === 12 || ketuHouse === 8) {
        traits += "Ketu's current transit alignment supports deep intuitive insights and spiritual auditing tasks.";
    } else {
        traits += "Ketu's alignment suggests maintaining complete transparency in communication streams.";
    }
    return traits;
}