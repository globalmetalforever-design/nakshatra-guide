import { normalizeDegrees } from "./birth_engine.js";

const RASI_SIZE = 30;

const rasiNames = [
    "Mesha",
    "Vrishabha",
    "Mithuna",
    "Karka",
    "Simha",
    "Kanya",
    "Tula",
    "Vrischika",
    "Dhanu",
    "Makara",
    "Kumbha",
    "Meena"
];

const rasiZodiacNames = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
];

function determineRasi(longitude) {
    const normalized = normalizeDegrees(longitude);
    const index = Math.min(Math.floor(normalized / RASI_SIZE), rasiNames.length - 1);

    return {
        index,
        number: index + 1,
        name: rasiNames[index],
        zodiacName: rasiZodiacNames[index],
        degree: normalized % RASI_SIZE
    };
}

function getRasi(longitude) {
    return determineRasi(longitude).name;
}

export {
    RASI_SIZE,
    determineRasi,
    getRasi,
    rasiNames,
    rasiZodiacNames
};

if (typeof window !== "undefined") {
    window.determineRasi = determineRasi;
    window.getRasi = getRasi;
}
