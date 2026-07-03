import { getTodayPanchang } from "./panchang_engine.js";

const SCORE_CATEGORIES = ["finance", "initiative", "relationships", "learning", "health"];

function emptyScores() {
    return { finance: 0, initiative: 0, relationships: 0, learning: 0, health: 0 };
}

function getScoreBand(score) {
    if (score >= 15) return "excellent";
    if (score >= 5) return "good";
    if (score >= -5) return "neutral";
    if (score >= -15) return "challenging";
    return "difficult";
}

function getTopCategory(scores) {
    let max = -Infinity;
    let cat = "learning";
    Object.entries(scores).forEach(([k, v]) => {
        if (v > max) { max = v; cat = k; }
    });
    return { category: cat, score: max };
}

function getAttentionCategory(scores) {
    let min = Infinity;
    let cat = "health";
    Object.entries(scores).forEach(([k, v]) => {
        if (v < min) { min = v; cat = k; }
    });
    return { category: cat, score: min };
}

function formatCategory(cat) {
    return cat.charAt(0).toUpperCase() + cat.slice(1);
}

function synthesizeDynamicNarrative(band, topCat, attCat, birthData) {
    const nakName = birthData?.nakshatra?.name || "your birth star";
    const rasiName = birthData?.rasi?.name || "your Moon sign";
    const padaNum = birthData?.pada?.number || 1;

    let introText = "";
    if (band === "excellent" || band === "good") {
        introText = `The planetary movements for this target date emphasize the natural resonance of **${nakName}** (Pada ${padaNum}). The transit velocities trigger high internal initiative and a driving focus to navigate ongoing objectives. `;
    } else if (band === "neutral") {
        introText = `The planetary trends operate at a highly stable, integrated frequency for **${nakName}** on this date. It provides a balanced structural window to lay foundations without sudden disruptions. `;
    } else {
        introText = `The surrounding cosmic configurations represent a distinct structural checkpoint for **${nakName}**. Energy vectors pull inward, prioritizing cautious stabilization over outer expansion. `;
    }

    let actionText = "";
    switch (band) {
        case "excellent":
            actionText = `With an elevated transit score, your capacity for swift problem-solving is fully maximized. Currents in your **${rasiName}** sector reveal an open alignment for professional advancement. `;
            break;
        case "good":
            actionText = `This alignment brings positive growth trajectories. It represents a highly favorable window to address intricate projects demanding close technical management. `;
            break;
        case "neutral":
            actionText = `Development fields advance at a measured, rhythmic pace. Your core planetary attributes indicate routine projects can be executed with excellent operational clarity. `;
            break;
        default:
            actionText = `Expect a temporary slowing of external momentum. Forcing rapid completions on this day introduces friction; conserve your energies through strategic pacing. `;
    }

    let closingText = `A path of least resistance and greatest emotional alignment on this day highlights your **${formatCategory(topCat.category)}** domain.`;

    return introText + actionText + closingText;
}

function synthesizeAttentionNarrative(band, attCat, birthData) {
    const nakName = birthData?.nakshatra?.name || "your birth star";
    const rasiName = birthData?.rasi?.name || "your Moon sign";
    const formattedCat = formatCategory(attCat.category);
    
    let text = `Your core awareness should look closely over your **${formattedCat}** domain during this transit window. `;

    if (band === "excellent") {
        text += `Even within highly charged periods, minor blind spots can cause friction. Your native **${nakName}** setup suggests monitoring details closely in the **${rasiName}** sector to prevent sudden operational oversights. `;
    } else if (band === "good") {
        text += `With supportive alignments dominant, minor leaks in focus represent your only real vulnerability. Keep tabs on the structural conditions of your **${rasiName}** placement to avoid scattered efforts. `;
    } else if (band === "neutral") {
        text += `Under balanced transit paths, the **${rasiName}** environment requests mindful upkeep rather than radical adjustments. Your **${nakName}** core profile may show slight fatigue or low patience with repeating tasks here. `;
    } else {
        text += `Planetary alignments create direct atmospheric resistance, which can manifest as elevated processing delays or friction points inside your **${rasiName}** structural house. `;
    }

    return text;
}

export async function generateDailyForecast(birthData, targetDate = new Date()) {
    // Both DOB and History hit this exact line now
    const panchang = await getTodayPanchang(targetDate);
    
    const daySeed = targetDate.getDate();
    const monthSeed = targetDate.getMonth() + 1;
    const yearSeed = targetDate.getFullYear();
    const nakNum = birthData?.nakshatra?.number || 1;
    
    // High variance calculation seed so different dates yield completely different results
    const seed = (daySeed * 7) + (monthSeed * 31) + (yearSeed ^ 7) + nakNum;
    const goodStart = 8 + (Math.abs(seed) % 5);
    const avoidStart = 14 + (Math.abs(seed) % 4);

    const scores = emptyScores();
    scores.finance = ((daySeed * monthSeed) % 11) - 4;
    scores.initiative = ((yearSeed - daySeed) % 9) - 3;
    scores.relationships = ((monthSeed * yearSeed) % 13) - 6;
    scores.learning = ((daySeed + yearSeed) % 7) - 2;
    scores.health = ((monthSeed + daySeed) % 8) - 4;

    const totalScore = Object.values(scores).reduce((total, value) => total + value, 0);
    const band = getScoreBand(totalScore);
    const topCategory = getTopCategory(scores);
    const attentionCategory = getAttentionCategory(scores);

    return {
        panchang,
        scores,
        totalScore,
        band,
        forecast: synthesizeDynamicNarrative(band, topCategory, attentionCategory, birthData),
        attention: synthesizeAttentionNarrative(band, attentionCategory, birthData),
        guidance: {
            luckyColor: Math.abs(seed) % 3 === 0 ? "Gold" : (Math.abs(seed) % 3 === 1 ? "Crimson" : "Royal Blue"),
            luckyNumber: (Math.abs(seed) % 9) + 1,
            goodTime: `${String(goodStart).padStart(2, "0")}:00 - ${String(goodStart + 1).padStart(2, "0")}:00`,
            badTime: `${String(avoidStart).padStart(2, "0")}:30 - ${String(avoidStart + 1).padStart(2, "0")}:30`,
            action: Math.abs(seed) % 2 === 0 ? "Anchor your space using conscious breathing patterns." : "Engage in silent reflection."
        }
    };
}