import { getTodayPanchang } from "./panchang_engine.js";

function buildHistoricalNarrative(band, topCategory, birthData) {
    const nakName = birthData?.nakshatra?.name || "your birth star";
    
    let text = "";
    if (band === "excellent" || band === "good") {
        text = `Historical data tracks an expansive trend for anyone born under **${nakName}**. The surrounding cosmic velocities on this past date promoted active leadership, clear communications, and highly favorable momentum for executing targeted goals.`;
    } else if (band === "neutral") {
        text = `Calculated history reflects a deeply stabilized, routine atmosphere for **${nakName}**. Environmental conditions maintained a steady, predictable rhythm, prioritizing structural organization over rapid advancements.`;
    } else {
        text = `Historical metrics indicate a distinct celestial checkpoint for **${nakName}**. Transit speeds on this timeline forced physical energy inward, creating an ideal window for retrospective analysis rather than outer exposure.`;
    }
    
    return `${text} Alignment metrics reveal that your peak personal fulfillment vector was centered closely within your **${topCategory}** domain.`;
}

function buildHistoricalAttention(band, attentionCategory, birthData) {
    const nakName = birthData?.nakshatra?.name || "your birth star";
    const rasiName = birthData?.rasi?.name || "your Moon sign";
    
    let text = `Historical tracking marks a clear processing bottleneck concentrated within your **${attentionCategory}** sector. `;
    
    if (band === "excellent" || band === "good") {
        text += `Even within highly productive windows, minor structural over-confidence or scattered focus could have introduced operational friction within your **${rasiName}** placement.`;
    } else {
        text += `Atmospheric planetary drag during this historical timeline likely exacerbated vulnerabilities toward low patience, emotional fatigue, or systematic delays within **${rasiName}**.`;
    }
    
    return text;
}

/**
 * Generates a localized plain-English forecast for a specific historical date.
 * @param {Object} birthData - The confirmed natal profile object.
 * @param {string} dateText - Input date string in DD-MM-YYYY format.
 * @returns {Promise<Object>} Synthesized historical forecast result.
 */
export async function getHistoricalForecast(birthData, dateText) {
    const match = dateText.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!match) {
        throw new Error("Enter historical date as DD-MM-YYYY.");
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
        throw new Error("Enter a valid historical calendar date.");
    }

    const historicalDate = new Date(year, month - 1, day, 12, 0, 0); //[cite: 2]
    const panchang = await getTodayPanchang(historicalDate);
    
    const nakNum = birthData?.nakshatra?.number || 1;
    const seed = (day * 13) + (month * 29) + (year ^ 11) + nakNum;
    
    const scores = {
        Finance: ((day * month) % 9) - 4,
        Initiative: ((year - day) % 7) - 3,
        Relationships: ((month * year) % 11) - 5,
        Learning: ((day + year) % 6) - 2,
        Health: ((month + day) % 8) - 4
    };
    
    let topCat = "Learning", attCat = "Health";
    let max = -Infinity, min = Infinity;
    
    Object.entries(scores).forEach(([cat, val]) => {
        if (val > max) { max = val; topCat = cat; }
        if (val < min) { min = val; attCat = cat; }
    });
    
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    let band = "neutral";
    if (totalScore >= 8) band = "excellent";
    else if (totalScore >= 2) band = "good";
    else if (totalScore <= -8) band = "difficult";
    else if (totalScore <= -2) band = "challenging";

    return {
        forecast: buildHistoricalNarrative(band, topCat, birthData),
        attention: buildHistoricalAttention(band, attCat, birthData)
    };
}